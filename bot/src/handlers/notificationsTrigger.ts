import * as Sentry from '@sentry/serverless';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { sendMessage } from '../bot/sender';
import { makeCallbackWrapper } from '../ext/aws/lambda';
import { sendDiscordAdminMessage } from '../ext/discord';
import { constructNotifications } from '../services/notifications';
import { NotificationMessage } from '../services/notifications/types';
import { getStage } from '../utils';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (
    _event: APIGatewayProxyEvent,
    _context,
    callback,
  ): Promise<APIGatewayProxyResult> => {
    const callbackWrapper = makeCallbackWrapper(callback);

    try {
      const notificationsOutput = await constructNotifications();
      if (notificationsOutput.isErr) {
        throw notificationsOutput.value;
      }

      const notifications = notificationsOutput.value;
      const notificationsResult = await sendNotifications(notifications);

      await sendDiscordAdminMessage(
        `[${getStage()}] NOTIFICATIONS\n\n` +
          `Success: ${notificationsResult.success}\n` +
          `Failure: ${notificationsResult.failure.length}\n` +
          `${notificationsResult.failure
            .map((entry) => `• ${entry}`)
            .join('\n')}`,
      );

      if (notificationsResult.failure.length > 0) {
        throw new Error(notificationsResult.failure.join(', '));
      }

      return callbackWrapper(204);
    } catch (error) {
      console.error('[notificationsTrigger]', error);
      Sentry.captureException(error);

      return callbackWrapper(400);
    }
  },
);

type NotificationsResult = { success: number; failure: string[] };

export const sendNotifications = async (
  notifications: NotificationMessage[],
): Promise<NotificationsResult> => {
  const notificationsPromiseResults = await Promise.all(
    notifications.map(async (notification) => {
      const { userId: chatId, message } = notification;
      return sendMessage({ chatId, message }).catch((error) => error);
    }),
  );

  const notificationsResult = notificationsPromiseResults.reduce(
    (_notificationsResult: NotificationsResult, promiseResult) => {
      if (promiseResult instanceof Error) {
        _notificationsResult.failure = [
          ..._notificationsResult.failure,
          promiseResult.message,
        ];
      } else {
        _notificationsResult.success += 1;
      }

      return _notificationsResult;
    },
    { success: 0, failure: [] },
  );
  return notificationsResult;
};

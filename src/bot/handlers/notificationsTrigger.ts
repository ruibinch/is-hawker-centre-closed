import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { sendDiscordAdminMessage } from '../../ext/discord';
import { getStage } from '../../utils/stage';
import { sendMessage } from '../sender';
import { constructNotifications } from '../services/notifications';
import type { NotificationMessage } from '../services/notifications/types';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (): Promise<APIGatewayProxyResult> => {
    try {
      const notificationsOutput = await constructNotifications();
      if (notificationsOutput.isErr) {
        throw notificationsOutput.value;
      }

      const notifications = notificationsOutput.value;
      const notificationsResult = await sendNotifications(notifications);

      await sendDiscordAdminMessage([
        `**[${getStage()}]  🔔 NOTIFICATIONS**`,
        `Success: ${notificationsResult.success}`,
        `Failure: ${notificationsResult.failure.length}`,
        ...notificationsResult.failure.map((entry) => `• ${entry}`),
      ]);

      return makeLambdaResponse(204);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[notificationsTrigger]', error);
        Sentry.captureException(error);
      }

      return makeLambdaResponse(400);
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

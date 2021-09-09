import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { sendMessage } from '../bot/sender';
import { makeCallbackWrapper } from '../ext/aws/lambda';
import { sendDiscordAdminMessage } from '../ext/discord';
import { constructNotifications } from '../services/notifications';
import { NotificationMessage } from '../services/notifications/types';
import { getStage } from '../utils';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  const notificationsOutput = await constructNotifications();
  if (notificationsOutput.isErr) {
    return callbackWrapper(400);
  }

  const notifications = notificationsOutput.value;
  const notificationsResult = await sendNotifications(notifications);

  await sendDiscordAdminMessage(
    `[${getStage()}] NOTIFICATIONS\n\n` +
      `Success: ${notificationsResult.success}\n` +
      `Failure: ${notificationsResult.failure.length}\n` +
      `${notificationsResult.failure.map((entry) => `• ${entry}`).join('\n')}`,
  );

  return callbackWrapper(204);
};

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

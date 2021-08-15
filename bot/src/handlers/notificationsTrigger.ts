import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { sendMessage } from '../bot/sender';
import { makeCallbackWrapper } from '../ext/aws/lambda';
import { sendDiscordAdminMessage } from '../ext/discord';
import { constructNotifications } from '../services/notifications';
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
  await Promise.all(
    notifications.map((notification) => {
      const { userId: chatId, message } = notification;
      return sendMessage({ chatId, message });
    }),
  );

  await sendDiscordAdminMessage(
    `[${getStage()}] NOTIFICATIONS\nNotifications sent to ${
      notifications.length
    } users`,
  );

  return callbackWrapper(204);
};

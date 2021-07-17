import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../aws/lambda';
import { sendMessage } from '../bot/sender';
import { constructNotifications } from '../services/notifications';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  const notificationsOutput = await constructNotifications();
  if (notificationsOutput.err) {
    return callbackWrapper(400);
  }

  await Promise.all(
    notificationsOutput.val.map((notification) => {
      const { userId: chatId, message } = notification;
      return sendMessage({ chatId, message });
    }),
  );

  return callbackWrapper(204);
};

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeSyncDb } from '../scripts/syncDb';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  await executeSyncDb();

  return callbackWrapper(204);
};

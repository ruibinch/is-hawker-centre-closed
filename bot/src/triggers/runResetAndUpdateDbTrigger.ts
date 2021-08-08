import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeResetAndUpdateDb } from '../scripts/resetAndUpdateDb';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  await executeResetAndUpdateDb();

  return callbackWrapper(204);
};

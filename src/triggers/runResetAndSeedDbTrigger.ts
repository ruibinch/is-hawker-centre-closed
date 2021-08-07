import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeResetAndSeedDb } from '../scripts/resetAndSeedDb';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  await executeResetAndSeedDb();

  return callbackWrapper(204);
};

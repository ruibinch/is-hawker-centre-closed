import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeManageDb } from '../scripts/manageDb';
import { run as executeSeedDb } from '../scripts/seedDb';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  await executeManageDb('reset');
  await executeSeedDb({ shouldWriteFile: false });

  return callbackWrapper(204);
};

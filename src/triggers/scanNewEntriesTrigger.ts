import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeScanNewEntries } from '../scripts/scanNewEntries';

export const handler: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  await executeScanNewEntries();

  return callbackWrapper(204);
};

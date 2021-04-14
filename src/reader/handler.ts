import { APIGatewayProxyHandler } from 'aws-lambda';
import { makeCallbackWrapper, makeResponseBody } from '../common/lambda';
import { processSearch } from './search';
import { SearchQuery } from './types';

export const search: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  const callbackWrapper = makeCallbackWrapper(callback);
  const { term } = event.queryStringParameters as SearchQuery;

  await processSearch(term).then((searchResponse) => {
    if (searchResponse === null) {
      callbackWrapper(400);
    } else {
      callbackWrapper(200, JSON.stringify(searchResponse));
    }
  });

  return makeResponseBody(502);
};

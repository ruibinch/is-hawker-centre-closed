import { APIGatewayProxyHandler } from 'aws-lambda';
import { makeCallbackWrapper } from '../common/lambda';
import { processSearch } from './search';
import { SearchQuery } from './types';

export const search: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  const callbackWrapper = makeCallbackWrapper(callback);
  const { term } = event.queryStringParameters as SearchQuery;

  await processSearch(term)
    .then((searchResponse) => {
      if (searchResponse === null) {
        return callbackWrapper(400);
      }

      return callbackWrapper(200, JSON.stringify(searchResponse));
    })
    .catch((error) => {
      console.log(error);
      return callbackWrapper(400);
    });

  return callbackWrapper(502);
};

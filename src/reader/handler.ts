import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Callback,
} from 'aws-lambda';
import { searchByHawkerCentre as searchByHC } from '../common/aws';
import { Query } from './types';

export const searchByHawkerCentre: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  const { keyword } = event.queryStringParameters as Query;
  const callbackWrapper = makeCallbackWrapper(callback);

  await searchByHC(keyword)
    .then((results) => {
      callbackWrapper(200, JSON.stringify(results));
    })
    .catch((error) => {
      console.log(error);
      callbackWrapper(400);
    });

  return makeResponseBody(502);
};

const makeCallbackWrapper = (callback: Callback<APIGatewayProxyResult>) => (
  statusCode: number,
  body?: string,
) => callback(null, makeResponseBody(statusCode, body));

const makeResponseBody = (statusCode: number, body?: string) => ({
  statusCode,
  body: body ?? '',
});

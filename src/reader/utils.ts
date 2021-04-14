import { APIGatewayProxyResult, Callback } from 'aws-lambda';
import { ResponseBody } from './types';

export const makeCallbackWrapper = (
  callback: Callback<APIGatewayProxyResult>,
) => (statusCode: number, body?: string): void =>
  callback(null, makeResponseBody(statusCode, body));

export const makeResponseBody = (
  statusCode: number,
  body?: string,
): ResponseBody => ({
  statusCode,
  body: body ?? '',
});

import { APIGatewayProxyResult, Callback } from 'aws-lambda';

export const makeCallbackWrapper = (
  callback: Callback<APIGatewayProxyResult>,
) => (statusCode: number, body?: string) =>
  callback(null, makeResponseBody(statusCode, body));

export const makeResponseBody = (statusCode: number, body?: string) => ({
  statusCode,
  body: body ?? '',
});

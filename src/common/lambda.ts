import { APIGatewayProxyResult, Callback } from 'aws-lambda';

type ResponseBody = {
  statusCode: number;
  body: string;
};

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

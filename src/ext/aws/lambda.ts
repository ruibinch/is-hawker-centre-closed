import type { APIGatewayProxyResult } from 'aws-lambda';

export const makeLambdaResponse = (
  statusCode: number,
  body?: string | Record<string, unknown>,
): APIGatewayProxyResult => {
  const responseBody = (() => {
    if (!body) {
      return '';
    }
    if (typeof body === 'object') {
      return JSON.stringify(body);
    }
    return body;
  })();

  return {
    statusCode,
    body: responseBody,
  };
};

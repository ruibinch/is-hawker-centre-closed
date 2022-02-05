import type { APIGatewayProxyResult } from 'aws-lambda';

export const makeLambdaResponse = (
  statusCode: number,
  body?: string,
): APIGatewayProxyResult => ({
  statusCode,
  body: body ?? '',
});

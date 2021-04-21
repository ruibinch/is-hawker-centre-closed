import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { BOT_TOKEN } from './variables';

type QueryParams = {
  token?: string;
};

export function validateToken(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const queryParams = queryStringParameters as QueryParams;
  return queryParams?.token === BOT_TOKEN;
}

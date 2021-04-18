import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { BOT_TOKEN } from './variables';

type QueryParams = {
  token?: string;
};

// TODO: write tests for this
export function validateToken(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
): boolean {
  const queryParams = queryStringParameters as QueryParams;
  return queryParams?.token === BOT_TOKEN;
}

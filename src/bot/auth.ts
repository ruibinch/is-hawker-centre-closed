import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';

type QueryParams = {
  token?: string;
};

/**
 * Naive method of cross-checking the `token` value sent in the HTTP request with the saved BOT_TOKEN.
 */
export function validateToken(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const queryParams = queryStringParameters as QueryParams;
  return queryParams?.token === process.env.BOT_TOKEN;
}

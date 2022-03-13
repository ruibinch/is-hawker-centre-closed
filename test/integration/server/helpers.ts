import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

export async function callServerHandler(
  handler: APIGatewayProxyHandler,
  requestBody?: Record<string, unknown> | undefined,
): Promise<APIGatewayProxyResult> {
  const event = {
    headers: {
      Authorization: 'Bearer pokemongottacatchthemall',
    },
    body: JSON.stringify(requestBody),
  } as unknown as APIGatewayProxyEvent;

  return handler(
    event,
    {} as Context,
    () => {},
  ) as Promise<APIGatewayProxyResult>;
}

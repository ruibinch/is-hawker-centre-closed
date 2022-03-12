import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { getAllUsers, User } from '../../models/User';
import {
  paginateResults,
  validateServerRequest,
  wrapErrorMessage,
} from '../helpers';
import type { GetUsersParams, ServerApiResponse } from '../types';

dotenv.config();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  if (!event.body) {
    return makeLambdaResponse(400, wrapErrorMessage('Missing request body'));
  }

  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.isErr) {
    return makeLambdaResponse(400, wrapErrorMessage('Error obtaining users'));
  }

  const params = JSON.parse(event.body) as GetUsersParams;
  const usersAll = getAllUsersResponse.value;

  const users =
    params.userId !== undefined
      ? usersAll.filter((user) => user.userId === params.userId)
      : usersAll;

  const usersPaginated = paginateResults(users, params);

  const responseBody: ServerApiResponse<User[]> = {
    total: users.length,
    count: usersPaginated.length,
    data: usersPaginated,
  };

  return makeLambdaResponse(200, responseBody);
};

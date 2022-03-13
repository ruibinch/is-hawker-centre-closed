import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { getAllUsers, User } from '../../models/User';
import { filterUserByUserId } from '../filters';
import {
  paginateResults,
  validateServerRequest,
  wrapErrorMessage,
} from '../helpers';
import { BaseQueryParams } from '../types';

dotenv.config();

type GetUsersParams = BaseQueryParams & {
  userId?: number;
};

type GetUsersResponse = {
  total: number;
  count: number;
  data: User[];
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getUsersResult = await handleGetUsers(event.body);

  return getUsersResult.isOk
    ? makeLambdaResponse(200, getUsersResult.value)
    : makeLambdaResponse(400, wrapErrorMessage(getUsersResult.value));
};

async function handleGetUsers(
  requestBody: string | null,
): Promise<ResultType<GetUsersResponse, string>> {
  if (!requestBody) {
    return Result.Err('Missing request body');
  }

  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.isErr) {
    return Result.Err('Error obtaining users');
  }

  const params = JSON.parse(requestBody) as GetUsersParams;
  const usersAll = getAllUsersResponse.value;

  const users = usersAll.filter((user) =>
    filterUserByUserId(user, params.userId),
  );

  const usersPaginated = paginateResults(users, params);

  return Result.Ok({
    total: users.length,
    count: usersPaginated.length,
    data: usersPaginated,
  });
}

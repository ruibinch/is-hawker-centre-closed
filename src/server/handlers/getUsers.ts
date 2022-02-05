import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeCallbackWrapper } from '../../ext/aws/lambda';
import { getAllUsers, User } from '../../models/User';
import type { ServerApiResponse } from '../../utils/types';
import { paginateResults } from '../helpers';
import type { GetUsersParams } from '../types';

dotenv.config();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  if (!event.body) {
    return callbackWrapper(400, 'Missing request body');
  }

  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.isErr) {
    return callbackWrapper(400, 'Error obtaining users');
  }

  const params = JSON.parse(event.body) as GetUsersParams;
  const usersAll = getAllUsersResponse.value;

  const users =
    params.userId !== undefined
      ? usersAll.filter((user) => user.userId === params.userId)
      : usersAll;

  const usersPaginated = paginateResults(users, params);

  const responseBody: ServerApiResponse<User[]> = {
    count: usersPaginated.length,
    data: usersPaginated,
  };

  return callbackWrapper(200, JSON.stringify(responseBody));
};

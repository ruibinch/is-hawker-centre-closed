import type {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { Result, type ResultType } from '../../../common/lib/Result';
import { makeCallbackWrapper } from '../ext/aws/lambda';
import { getAllInputs, type Input } from '../models/Input';
import { getAllUsers, type User } from '../models/User';
import type { ApiResponse } from '../utils';

dotenv.config();
const serverApiToken = process.env.SERVER_API_TOKEN ?? '';

export const getInputs: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  const authResult = performAuth(event.headers);
  if (authResult.isErr) {
    return callbackWrapper(403);
  }

  const getAllInputsResult = await getAllInputs();
  if (getAllInputsResult.isErr) {
    return callbackWrapper(400, JSON.stringify(getAllInputsResult.value));
  }

  const inputs = getAllInputsResult.value;
  const responseBody: ApiResponse<Input[]> = {
    count: inputs.length,
    data: inputs,
  };

  return callbackWrapper(200, JSON.stringify(responseBody));
};

export const getUsers: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  const authResult = performAuth(event.headers);
  if (authResult.isErr) {
    return callbackWrapper(403);
  }

  const getAllUsersResult = await getAllUsers();
  if (getAllUsersResult.isErr) {
    return callbackWrapper(400, JSON.stringify(getAllUsersResult.value));
  }

  const users = getAllUsersResult.value;
  const responseBody: ApiResponse<User[]> = {
    count: users.length,
    data: users,
  };

  return callbackWrapper(200, JSON.stringify(responseBody));
};

function performAuth(headers: APIGatewayProxyEventHeaders): ResultType {
  const authorizationHeader = headers['Authorization'];
  if (!authorizationHeader) {
    return Result.Err();
  }

  const [tokenType, tokenValue] = authorizationHeader.split(' ');

  return tokenType === 'Bearer' && tokenValue === serverApiToken
    ? Result.Ok()
    : Result.Err();
}

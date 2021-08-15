import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { getAllInputs, Input } from '../models/Input';
import { getAllUsers, User } from '../models/User';
import { ApiResponse } from '../utils';

export const getInputs: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

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
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

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

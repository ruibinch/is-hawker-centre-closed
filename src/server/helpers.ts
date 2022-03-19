import type { APIGatewayProxyEventHeaders } from 'aws-lambda';

import { Feedback } from '../models/Feedback';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { BaseQueryParams } from './types';

export function validateServerRequest(headers: APIGatewayProxyEventHeaders) {
  const authHeaderSplit = headers['Authorization']?.split(' ');
  if (!authHeaderSplit) return false;

  const [authType, authToken] = authHeaderSplit;
  return authType === 'Bearer' && authToken === process.env.SERVER_AUTH_TOKEN;
}

export function paginateResults<T extends Feedback | Input | User>(
  results: T[],
  params: BaseQueryParams,
): T[] {
  const page = params.page ?? 1;
  const size = params.size ?? 50;

  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  return results.slice(startIndex, endIndex);
}

export function wrapErrorMessage(errorMessage: string) {
  return JSON.stringify({
    error: errorMessage,
  });
}

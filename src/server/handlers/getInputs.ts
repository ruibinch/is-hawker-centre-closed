import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { isAfter, isBefore, parseISO } from 'date-fns';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { getAllInputs, Input, sortInputsByTime } from '../../models/Input';
import { getDateIgnoringTime } from '../../utils/date';
import {
  paginateResults,
  validateServerRequest,
  wrapErrorMessage,
} from '../helpers';
import type { GetInputsParams, ServerApiResponse } from '../types';

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

  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return makeLambdaResponse(400, wrapErrorMessage('Error obtaining inputs'));
  }

  const params = JSON.parse(event.body) as GetInputsParams;
  const inputsAll = getAllInputsResponse.value;

  const inputs = inputsAll.filter((input) => {
    if (params.userId !== undefined && input.userId !== params.userId) {
      return false;
    }

    const inputCreatedDate = parseISO(getDateIgnoringTime(input.createdAt));

    if (params.fromDate) {
      const fromDate = parseISO(params.fromDate);
      if (isBefore(inputCreatedDate, fromDate)) {
        return false;
      }
    }
    if (params.toDate) {
      const toDate = parseISO(params.toDate);
      if (isAfter(inputCreatedDate, toDate)) {
        return false;
      }
    }

    return true;
  });

  const inputsSorted = sortInputsByTime(inputs, 'desc');
  const inputsSortedPaginated = paginateResults(inputsSorted, params);

  const responseBody: ServerApiResponse<Input[]> = {
    total: inputsSorted.length,
    count: inputsSortedPaginated.length,
    data: inputsSortedPaginated,
  };

  return makeLambdaResponse(200, responseBody);
};

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { getAllInputs, Input, sortInputsByTime } from '../../models/Input';
import { filterInputByDate, filterInputByUserId } from '../filters';
import {
  paginateResults,
  validateServerRequest,
  wrapErrorMessage,
} from '../helpers';
import { BaseQueryParams } from '../types';

dotenv.config();

type GetInputsParams = BaseQueryParams & {
  fromDate?: string;
  toDate?: string;
  userId?: number;
};

type GetInputsResponse = {
  total: number;
  count: number;
  data: Input[];
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getInputsResult = await handleGetInputs(event.body);

  return getInputsResult.isOk
    ? makeLambdaResponse(200, getInputsResult.value)
    : makeLambdaResponse(400, wrapErrorMessage(getInputsResult.value));
};

async function handleGetInputs(
  requestBody: string | null,
): Promise<ResultType<GetInputsResponse, string>> {
  if (!requestBody) {
    return Result.Err('Missing request body');
  }

  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return Result.Err('Error obtaining inputs');
  }

  const params = JSON.parse(requestBody) as GetInputsParams;
  const inputsAll = getAllInputsResponse.value;

  const inputs = inputsAll
    .filter((input) => filterInputByUserId(input, params.userId))
    .filter((input) =>
      filterInputByDate(input, params.fromDate, params.toDate),
    );

  const inputsSorted = sortInputsByTime(inputs, 'desc');
  const inputsSortedPaginated = paginateResults(inputsSorted, params);

  return Result.Ok({
    total: inputsSorted.length,
    count: inputsSortedPaginated.length,
    data: inputsSortedPaginated,
  });
}

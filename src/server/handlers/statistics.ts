import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { Input } from '../../models/Input';
import { validateServerRequest, wrapErrorMessage } from '../helpers';
import { getSelectedTimeframes } from '../services/statistics/common';
import { fetchData } from '../services/statistics/fetchData';
import { calculateInputsStats } from '../services/statistics/inputs';
import type {
  Scope,
  StatsEntry,
  Timeframe,
} from '../services/statistics/types';

dotenv.config();

type GetStatisticsParams = {
  fromDate?: string;
  toDate?: string;
  scopes?: Partial<Record<Scope, boolean>>;
  timeframes?: Partial<Record<Timeframe, boolean>>;
};

// TODO: explore RecursivePartial type
type GetStatisticsResponse = {
  data: Partial<Record<Scope, Partial<Record<Timeframe, StatsEntry[]>>>>;
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getStatisticsResult = await handleGetStatistics(event.body);

  return getStatisticsResult.isOk
    ? makeLambdaResponse(200, getStatisticsResult.value)
    : makeLambdaResponse(400, wrapErrorMessage(getStatisticsResult.value));
};

async function handleGetStatistics(
  requestBody: string | null,
): Promise<ResultType<GetStatisticsResponse, string>> {
  if (!requestBody) {
    return Result.Err('Missing request body');
  }

  const params = JSON.parse(requestBody) as GetStatisticsParams;

  const timeframes = getSelectedTimeframes(params.timeframes);
  if (timeframes.length === 0) {
    return Result.Err('No timeframes specified');
  }

  const { scopes } = params;
  if (!scopes || Object.values(scopes).every((v) => !v)) {
    return Result.Err('No scopes specified');
  }

  const fetchDataResult = await fetchData({
    scopes,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
  if (fetchDataResult.isErr) {
    return fetchDataResult;
  }

  const { inputs, users } = fetchDataResult.value;

  let inputsStats = {};

  if (scopes.inputs) {
    const inputsStatsResult = await calculateInputsStats({
      inputs: inputs as Input[],
      timeframes,
    });
    if (inputsStatsResult.isErr) {
      return Result.Err(inputsStatsResult.value);
    }
    inputsStats = inputsStatsResult.value;
  }

  const statsData: GetStatisticsResponse['data'] = {
    inputs: inputsStats,
  };

  return Result.Ok({ data: statsData });
}

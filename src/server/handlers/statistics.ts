import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { Input } from '../../models/Input';
import { User } from '../../models/User';
import { validateServerRequest, wrapErrorMessage } from '../helpers';
import { includesSome } from '../services/statistics/common';
import { fetchData } from '../services/statistics/fetchData';
import { calculateInputsStats } from '../services/statistics/inputs';
import { parseRequestBody } from '../services/statistics/parser';
import { calculatePercentageUsersWithFavsStats } from '../services/statistics/percentageUsersWithFavs';
import type {
  Scope,
  StatsEntry,
  Timeframe,
} from '../services/statistics/types';
import { calculateUsersStats } from '../services/statistics/users';
import { calculateUsersWithFavsStats } from '../services/statistics/usersWithFavs';

dotenv.config();

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

  const parseResult = parseRequestBody(requestBody);
  if (parseResult.isErr) {
    return Result.Err(parseResult.value);
  }
  const params = parseResult.value;
  const { fromDate, toDate, scopes, timeframes } = params;

  if (!timeframes) {
    return Result.Err('No timeframes specified');
  }
  if (!scopes) {
    return Result.Err('No scopes specified');
  }

  const fetchDataResult = await fetchData({
    scopes,
    fromDate,
    toDate,
  });
  if (fetchDataResult.isErr) {
    return fetchDataResult;
  }

  const { inputs, users } = fetchDataResult.value;

  let inputsStats = {};
  let usersStats = {};
  let usersWithFavsStats = {};
  let percentageUsersWithFavsStats = {};

  if (includesSome(scopes, ['inputs'])) {
    const inputsStatsResult = await calculateInputsStats({
      inputs: inputs as Input[],
      timeframes,
      fromDate,
      toDate,
    });
    if (inputsStatsResult.isErr) {
      return Result.Err(inputsStatsResult.value);
    }
    inputsStats = inputsStatsResult.value;
  }

  if (includesSome(scopes, ['users', 'percentageUsersWithFavs'])) {
    const usersStatsResult = await calculateUsersStats({
      inputs: inputs as Input[],
      timeframes,
      fromDate,
      toDate,
    });
    if (usersStatsResult.isErr) {
      return Result.Err(usersStatsResult.value);
    }
    usersStats = usersStatsResult.value;
  }

  if (includesSome(scopes, ['usersWithFavs', 'percentageUsersWithFavs'])) {
    const usersWithFavsStatsResult = await calculateUsersWithFavsStats({
      users: users as User[],
      timeframes,
      fromDate,
      toDate,
    });
    if (usersWithFavsStatsResult.isErr) {
      return Result.Err(usersWithFavsStatsResult.value);
    }
    usersWithFavsStats = usersWithFavsStatsResult.value;
  }

  if (includesSome(scopes, ['percentageUsersWithFavs'])) {
    percentageUsersWithFavsStats = calculatePercentageUsersWithFavsStats({
      usersStats,
      usersWithFavsStats,
    });
  }

  const statsDataAll: GetStatisticsResponse['data'] = {
    inputs: inputsStats,
    users: usersStats,
    usersWithFavs: usersWithFavsStats,
    percentageUsersWithFavs: percentageUsersWithFavsStats,
  };
  const statsData = Object.entries(statsDataAll).reduce(
    (_statsData: typeof statsDataAll, [scope, scopeStats]) => {
      if (scopes.includes(scope as Scope)) {
        _statsData[scope as Scope] = scopeStats;
      }
      return _statsData;
    },
    {},
  );

  return Result.Ok({ data: statsData });
}

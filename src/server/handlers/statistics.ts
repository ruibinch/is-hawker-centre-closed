import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { HawkerCentre } from '../../models/HawkerCentre';
import { Input } from '../../models/Input';
import { User } from '../../models/User';
import { validateServerRequest, wrapErrorMessage } from '../helpers';
import { includesSome, isScope } from '../services/statistics/common';
import { fetchData } from '../services/statistics/fetchData';
import { calculateHawkerCentreFavsCount } from '../services/statistics/hawkerCentreFavsCount';
import { calculateInputsStats } from '../services/statistics/inputs';
import {
  calculateInputsByDayStats,
  DayOfWeek,
} from '../services/statistics/inputsByDay';
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

type GetStatisticsResponse = {
  data: Partial<{
    inputs: Partial<Record<Timeframe, StatsEntry[]>>;
    inputsByDay: Record<DayOfWeek, number>;
    users: Partial<Record<Timeframe, StatsEntry[]>>;
    usersWithFavs: Partial<Record<Timeframe, StatsEntry[]>>;
    percentageUsersWithFavs: Partial<Record<Timeframe, StatsEntry[]>>;
    hawkerCentreFavsCount: Array<HawkerCentre & { count: number }>;
  }>;
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

  const { inputs, users, hawkerCentres } = fetchDataResult.value;
  const statsData: GetStatisticsResponse['data'] = {};

  if (includesSome<Scope>(scopes, ['inputs'])) {
    const inputsStatsResult = await calculateInputsStats({
      inputs: inputs as Input[],
      timeframes,
      fromDate,
      toDate,
    });
    if (inputsStatsResult.isErr) {
      return Result.Err(inputsStatsResult.value);
    }
    statsData.inputs = inputsStatsResult.value;
  }

  if (includesSome<Scope>(scopes, ['inputsByDay'])) {
    statsData.inputsByDay = calculateInputsByDayStats({
      inputs: inputs as Input[],
    });
  }

  if (includesSome<Scope>(scopes, ['users', 'percentageUsersWithFavs'])) {
    const usersStatsResult = await calculateUsersStats({
      inputs: inputs as Input[],
      timeframes,
      fromDate,
      toDate,
    });
    if (usersStatsResult.isErr) {
      return Result.Err(usersStatsResult.value);
    }
    statsData.users = usersStatsResult.value;
  }

  if (
    includesSome<Scope>(scopes, ['usersWithFavs', 'percentageUsersWithFavs'])
  ) {
    const usersWithFavsStatsResult = await calculateUsersWithFavsStats({
      users: users as User[],
      timeframes,
      fromDate,
      toDate,
    });
    if (usersWithFavsStatsResult.isErr) {
      return Result.Err(usersWithFavsStatsResult.value);
    }
    statsData.usersWithFavs = usersWithFavsStatsResult.value;
  }

  if (includesSome<Scope>(scopes, ['percentageUsersWithFavs'])) {
    if (!statsData.users || !statsData.usersWithFavs) {
      return Result.Err(
        'Error computing percentageUsersWithFavs: users or usersWithFavs is undefined',
      );
    }

    statsData.percentageUsersWithFavs = calculatePercentageUsersWithFavsStats({
      usersStats: statsData.users,
      usersWithFavsStats: statsData.usersWithFavs,
    });
  }

  if (includesSome<Scope>(scopes, ['hawkerCentreFavsCount'])) {
    statsData.hawkerCentreFavsCount = calculateHawkerCentreFavsCount({
      users: users as User[],
      hawkerCentres: hawkerCentres as HawkerCentre[],
    });
  }

  // some scope results are computed solely to be used when computing other scopes
  // if these "enabler" scopes are not in the params list, remove them from the statsData dict
  Object.keys(statsData).forEach((scope) => {
    if (isScope(scope) && !scopes.includes(scope)) {
      statsData[scope] = undefined;
    }
  });

  return Result.Ok({ data: statsData });
}

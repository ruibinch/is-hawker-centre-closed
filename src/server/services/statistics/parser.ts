import { Result, ResultType } from '../../../lib/Result';
import { Undefined } from '../../../utils/types';
import { isScope, isTimeframe } from './common';
import { Scope, Timeframe } from './types';

type GetStatisticsParams = Undefined<{
  fromDate: string;
  toDate: string;
  scopes: Scope[];
  timeframes: Timeframe[];
}>;

export function parseRequestBody(
  requestBody: string,
): ResultType<GetStatisticsParams, string> {
  const params = JSON.parse(requestBody) as Partial<{
    fromDate: unknown;
    toDate: unknown;
    scopes: unknown[];
    timeframes: unknown[];
  }>;
  let fromDate: GetStatisticsParams['fromDate'];
  let toDate: GetStatisticsParams['toDate'];
  let scopes: GetStatisticsParams['scopes'];
  let timeframes: GetStatisticsParams['timeframes'];

  if (params.fromDate) {
    if (typeof params.fromDate !== 'string') {
      return Result.Err('Invalid type of fromDate');
    }
    fromDate = params.fromDate;
  }
  if (params.toDate) {
    if (typeof params.toDate !== 'string') {
      return Result.Err('Invalid type of toDate');
    }
    toDate = params.toDate;
  }
  if (params.scopes) {
    if (!Array.isArray(params.scopes) || !params.scopes.every(isScope)) {
      return Result.Err('Invalid type of scopes');
    }
    scopes = params.scopes;
  }
  if (params.timeframes) {
    if (
      !Array.isArray(params.timeframes) ||
      !params.timeframes.every(isTimeframe)
    ) {
      return Result.Err('Invalid type of timeframes');
    }
    timeframes = params.timeframes;
  }

  return Result.Ok({
    fromDate,
    toDate,
    scopes,
    timeframes,
  });
}

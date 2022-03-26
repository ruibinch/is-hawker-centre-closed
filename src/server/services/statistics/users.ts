import { parseISO } from 'date-fns';

import { Result, ResultType } from '../../../lib/Result';
import { Input } from '../../../models/Input';
import { toDateISO8601 } from '../../../utils/date';
import { makeTimeframeList, updateTimeframeListIndex } from './common';
import { Timeframe, StatsForTimeframe } from './types';

export async function calculateUsersStats({
  inputs,
  timeframes: timeframesBase,
}: {
  inputs: Input[];
  timeframes: { timeframe: Timeframe }[];
}): Promise<ResultType<StatsForTimeframe, string>> {
  const firstInputDate = parseISO(inputs[0].createdAt);
  const lastInputDate = parseISO(inputs[inputs.length - 1].createdAt);

  let timeframes = timeframesBase.map(({ timeframe }) => {
    const timeframeList = makeTimeframeList(
      firstInputDate,
      lastInputDate,
      timeframe,
    );

    return {
      timeframe,
      data: timeframeList.map((date) => ({
        date,
        new: 0,
      })),
      currentIndex: 0,
    };
  });

  const userIds: number[] = [];

  inputs.forEach((input) => {
    if (userIds.includes(input.userId)) return;

    timeframes = timeframes.map((entry) => {
      const updatedIndex = updateTimeframeListIndex(
        parseISO(input.createdAt),
        entry.data,
        entry.currentIndex,
      );

      entry.data[updatedIndex].new += 1;

      return {
        ...entry,
        currentIndex: updatedIndex,
      };
    });

    userIds.push(input.userId);
  });

  const usersStats = timeframes.reduce(
    (_usersStats: StatsForTimeframe, { timeframe, data }) => {
      let total = 0;

      _usersStats[timeframe] = data.map((d) => {
        total += d.new;

        return {
          date: toDateISO8601(d.date),
          new: d.new,
          total,
        };
      });

      return _usersStats;
    },
    {},
  );

  return Result.Ok(usersStats);
}

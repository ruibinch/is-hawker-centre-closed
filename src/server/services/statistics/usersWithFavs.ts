import { parseISO } from 'date-fns';

import { Result, ResultType } from '../../../lib/Result';
import { User } from '../../../models/User';
import { toDateISO8601 } from '../../../utils/date';
import { makeTimeframeList, updateTimeframeListIndex } from './common';
import { Timeframe, StatsForTimeframe } from './types';

type Props = {
  users: User[];
  timeframes: { timeframe: Timeframe }[];
  fromDate: string | undefined;
  toDate: string | undefined;
};

export async function calculateUsersWithFavsStats({
  users,
  timeframes: timeframesBase,
  fromDate,
  toDate,
}: Props): Promise<ResultType<StatsForTimeframe, string>> {
  const firstUserCreatedDate = parseISO(fromDate ?? users[0].createdAt);
  const lastUserCreatedDate = parseISO(
    toDate ?? users[users.length - 1].createdAt,
  );

  let timeframes = timeframesBase.map(({ timeframe }) => {
    const timeframeList = makeTimeframeList(
      firstUserCreatedDate,
      lastUserCreatedDate,
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

  users.forEach((user) => {
    timeframes = timeframes.map((entry) => {
      const updatedIndex = updateTimeframeListIndex(
        parseISO(user.createdAt),
        entry.data,
        entry.currentIndex,
      );

      entry.data[updatedIndex].new += 1;

      return {
        ...entry,
        currentIndex: updatedIndex,
      };
    });
  });

  const usersWithFavsStats = timeframes.reduce(
    (_usersWithFavsStats: StatsForTimeframe, { timeframe, data }) => {
      let total = 0;

      _usersWithFavsStats[timeframe] = data.map((d) => {
        total += d.new;

        return {
          date: toDateISO8601(d.date),
          new: d.new,
          total,
        };
      });

      return _usersWithFavsStats;
    },
    {},
  );

  return Result.Ok(usersWithFavsStats);
}

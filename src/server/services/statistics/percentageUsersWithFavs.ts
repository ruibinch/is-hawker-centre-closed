import { StatsEntry, StatsForTimeframe, Timeframe } from './types';

type Props = {
  usersStats: StatsForTimeframe;
  usersWithFavsStats: StatsForTimeframe;
};

export function calculatePercentageUsersWithFavsStats({
  usersStats,
  usersWithFavsStats,
}: Props): StatsForTimeframe {
  const percentageUsersWithFavsStats = Object.entries(usersStats).reduce(
    (
      _percentageUsersWithFavsStats: StatsForTimeframe,
      [timeframe, usersStatsData],
    ) => {
      // type assertion as this will never be undefined
      const usersWithFavsStatsForTimeframe = usersWithFavsStats[
        timeframe as Timeframe
      ] as StatsEntry[];

      // @ts-expect-error timeframe is of Timeframe type
      _percentageUsersWithFavsStats[timeframe] = usersStatsData.map(
        (usersStatsDatum, idx) => {
          const usersWithFavsStatsDatum = usersWithFavsStatsForTimeframe[idx];

          return {
            date: usersStatsDatum.date,
            new: usersWithFavsStatsDatum.new / usersStatsDatum.new,
            total: usersWithFavsStatsDatum.total / usersStatsDatum.total,
          };
        },
      );

      return _percentageUsersWithFavsStats;
    },
    {},
  );

  return percentageUsersWithFavsStats;
}

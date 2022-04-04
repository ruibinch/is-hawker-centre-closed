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

      let usersWithFavsTotal = 0;

      // @ts-expect-error timeframe is of Timeframe type
      _percentageUsersWithFavsStats[timeframe] = usersStatsData.map(
        (usersStatsDatum) => {
          const usersWithFavsStatsDatum = usersWithFavsStatsForTimeframe.find(
            (entry) => entry.date === usersStatsDatum.date,
          );
          if (usersWithFavsStatsDatum?.total !== undefined) {
            usersWithFavsTotal = usersWithFavsStatsDatum.total;
          }

          return {
            date: usersStatsDatum.date,
            new:
              usersStatsDatum.new === 0
                ? 0
                : roundTo2DP(
                    (usersWithFavsStatsDatum?.new ?? 0) / usersStatsDatum.new,
                  ),
            total: roundTo2DP(usersWithFavsTotal / usersStatsDatum.total),
          };
        },
      );

      return _percentageUsersWithFavsStats;
    },
    {},
  );

  return percentageUsersWithFavsStats;
}

function roundTo2DP(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

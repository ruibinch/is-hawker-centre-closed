import { parseISO } from 'date-fns';

import { Result, ResultType } from '../../../lib/Result';
import { Input } from '../../../models/Input';
import { toDateISO8601 } from '../../../utils/date';
import { makeTimeframeList, updateTimeframeListIndex } from './common';
import { StatsForTimeframe, Timeframe } from './types';

type Props = {
  inputs: Input[];
  timeframes: Timeframe[];
  fromDate: string | undefined;
  toDate: string | undefined;
};

export async function calculateInputsStats({
  inputs,
  timeframes: timeframesBase,
  fromDate,
  toDate,
}: Props): Promise<ResultType<StatsForTimeframe, string>> {
  const firstInputDate = parseISO(fromDate ?? inputs[0].createdAt);
  const lastInputDate = parseISO(toDate ?? inputs[inputs.length - 1].createdAt);

  let timeframes = timeframesBase.map((timeframe) => {
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

  inputs.forEach((input) => {
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
  });

  const inputsStats = timeframes.reduce(
    (_inputsStats: StatsForTimeframe, { timeframe, data }) => {
      let total = 0;

      _inputsStats[timeframe] = data.map((d) => {
        total += d.new;

        return {
          date: toDateISO8601(d.date),
          new: d.new,
          total,
        };
      });

      return _inputsStats;
    },
    {},
  );

  return Result.Ok(inputsStats);
}

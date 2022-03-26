import { parseISO } from 'date-fns';

import { Result, ResultType } from '../../../lib/Result';
import { getAllInputs, sortInputsByTime } from '../../../models/Input';
import { isAfterOrEqual, toDateISO8601 } from '../../../utils/date';
import { filterItemsByDate } from '../../filters';
import { makeTimeframeList } from './common';
import { StatsForTimeframe, Timeframe } from './types';

export async function calculateInputsStats({
  fromDate,
  toDate,
  timeframes: timeframesBase,
}: {
  fromDate: string | undefined;
  toDate: string | undefined;
  timeframes: { timeframe: Timeframe }[];
}): Promise<ResultType<StatsForTimeframe, string>> {
  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return Result.Err('Error obtaining inputs');
  }

  const inputsAll = getAllInputsResponse.value;
  const inputsFiltered = inputsAll.filter((input) =>
    filterItemsByDate(input, fromDate, toDate),
  );
  const inputs = sortInputsByTime(inputsFiltered, 'asc');

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
        total: 0,
      })),
      currentIndex: 0,
    };
  });

  inputs.forEach((input) => {
    const inputCreatedDate = parseISO(input.createdAt);

    timeframes = timeframes.map((entry) => {
      const updatedIndex = updateTimeframeListIndex(
        inputCreatedDate,
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

function updateTimeframeListIndex(
  currentEntryDate: Date,
  data: { date: Date }[],
  _currentIndex: number,
) {
  const getStartOfNextTimeframe = (index: number) =>
    index < data.length - 1 ? data[index + 1].date : undefined;

  let currentIndex = _currentIndex;
  let startOfNextTimeframe = getStartOfNextTimeframe(currentIndex);

  while (
    startOfNextTimeframe &&
    isAfterOrEqual(currentEntryDate, startOfNextTimeframe)
  ) {
    currentIndex += 1;
    startOfNextTimeframe = getStartOfNextTimeframe(currentIndex);
  }

  return currentIndex;
}

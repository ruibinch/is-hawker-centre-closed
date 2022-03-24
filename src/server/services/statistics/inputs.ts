import { parseISO } from 'date-fns';

import { ResultType, Result } from '../../../lib/Result';
import { getAllInputs, Input, sortInputsByTime } from '../../../models/Input';
import { isAfterOrEqual, toDateISO8601 } from '../../../utils/date';
import { filterItemsByDate } from '../../filters';
import { makeTimeframeList } from './common';
import { Timeframe, StatsEntry } from './types';

type InputStatsData = Record<
  'inputs' | 'inputsByNewUsers',
  Partial<Record<Timeframe, StatsEntry[]>>
>;

export async function calculateInputStatistics({
  fromDate,
  toDate,
  timeframes,
}: {
  fromDate: string | undefined;
  toDate: string | undefined;
  timeframes: { timeframe: Timeframe }[];
}): Promise<ResultType<InputStatsData, string>> {
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
  const usersFirstSeen = makeUsersFirstSeenDict(inputsAll);

  let timeframesWithCounters = timeframes.map(({ timeframe }) => {
    const timeframeList = makeTimeframeList(
      firstInputDate,
      lastInputDate,
      timeframe,
    );

    return {
      timeframe,
      timeframeCountData: timeframeList.map((date) => ({
        date,
        inputsCount: 0,
        inputsByNewUsersCount: 0,
      })),
      currentIndex: 0,
    };
  });

  inputs.forEach((input) => {
    const inputCreatedDate = parseISO(input.createdAt);

    timeframesWithCounters = timeframesWithCounters.map((entry) => {
      const updatedIndex = updateTimeframeListIndex(
        inputCreatedDate,
        entry.timeframeCountData,
        entry.currentIndex,
      );

      entry.timeframeCountData[updatedIndex].inputsCount += 1;

      const userFirstSeenDate = usersFirstSeen[input.userId];
      if (userFirstSeenDate === input.createdAt) {
        entry.timeframeCountData[updatedIndex].inputsByNewUsersCount += 1;
      }

      return {
        ...entry,
        currentIndex: updatedIndex,
      };
    });
  });

  const inputStats = timeframesWithCounters.reduce(
    (_inputStats: InputStatsData, { timeframe, timeframeCountData }) => {
      _inputStats.inputs[timeframe] = timeframeCountData.map((d) => ({
        date: toDateISO8601(d.date),
        count: d.inputsCount,
      }));

      _inputStats.inputsByNewUsers[timeframe] = timeframeCountData.map((d) => ({
        date: toDateISO8601(d.date),
        count: d.inputsByNewUsersCount,
      }));

      return _inputStats;
    },
    {
      inputs: {},
      inputsByNewUsers: {},
    },
  );

  return Result.Ok(inputStats);
}

function makeUsersFirstSeenDict(inputsAll: Input[]) {
  return inputsAll.reduce((users: Record<string, string>, input) => {
    if (users[input.userId]) return users;

    users[input.userId] = input.createdAt;
    return users;
  }, {});
}

function updateTimeframeListIndex(
  currentEntryDate: Date,
  timeframeCountData: Array<{ date: Date }>,
  _currentIndex: number,
) {
  const getStartOfNextTimeframe = (index: number) =>
    index < timeframeCountData.length - 1
      ? timeframeCountData[index + 1].date
      : undefined;

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

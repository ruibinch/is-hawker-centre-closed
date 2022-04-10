import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
} from 'date-fns';

import { isAfterOrEqual } from '../../../utils/date';
import { Scope, Timeframe } from './types';

export function isScope(s: unknown): s is Scope {
  return (
    s === 'inputs' ||
    s === 'inputsByDay' ||
    s === 'users' ||
    s === 'usersWithFavs' ||
    s === 'percentageUsersWithFavs' ||
    s === 'hawkerCentreFavsCount'
  );
}

export function isTimeframe(s: unknown): s is Timeframe {
  return s === 'byMonth' || s === 'byWeek' || s === 'byDay';
}

export function includesSome<T>(baseArray: T[], values: T[]) {
  return values.some((value) => baseArray.includes(value));
}

export function makeTimeframeList(
  startDate: Date,
  endDate: Date,
  interval: Timeframe,
) {
  if (interval === 'byMonth') {
    return eachMonthOfInterval({
      start: startDate,
      end: endDate,
    });
  }
  if (interval === 'byWeek') {
    return eachWeekOfInterval(
      {
        start: startDate,
        end: endDate,
      },
      {
        weekStartsOn: 1, // week starts on Monday
      },
    );
  }
  return eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
}

export function updateTimeframeListIndex(
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

import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
} from 'date-fns';

import { isAfterOrEqual } from '../../../utils/date';
import { Timeframe } from './types';

export function getSelectedTimeframes(
  timeframes: Partial<Record<Timeframe, boolean>> | undefined,
) {
  return Object.entries(timeframes ?? []).reduce(
    (
      _selectedTimeframes: Array<{ timeframe: Timeframe }>,
      [timeframe, toggleValue],
    ) => {
      if (toggleValue) {
        _selectedTimeframes.push({ timeframe: timeframe as Timeframe });
      }
      return _selectedTimeframes;
    },
    [],
  );
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

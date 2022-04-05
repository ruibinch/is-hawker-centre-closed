import {
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isTuesday,
  isWednesday,
  parseISO,
} from 'date-fns';

import { Input } from '../../../models/Input';

type Props = {
  inputs: Input[];
};

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export function calculateInputsByDayStats({
  inputs,
}: Props): Record<DayOfWeek, number> {
  const inputsByDayStats = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
  };

  inputs.forEach((input) => {
    const inputDate = parseISO(input.createdAt);

    if (isMonday(inputDate)) {
      inputsByDayStats.mon += 1;
    } else if (isTuesday(inputDate)) {
      inputsByDayStats.tue += 1;
    } else if (isWednesday(inputDate)) {
      inputsByDayStats.wed += 1;
    } else if (isThursday(inputDate)) {
      inputsByDayStats.thu += 1;
    } else if (isFriday(inputDate)) {
      inputsByDayStats.fri += 1;
    } else if (isSaturday(inputDate)) {
      inputsByDayStats.sat += 1;
    } else if (isSunday(inputDate)) {
      inputsByDayStats.sun += 1;
    }
  });

  return inputsByDayStats;
}

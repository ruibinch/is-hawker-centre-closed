import {
  addDays,
  addWeeks,
  eachWeekOfInterval,
  endOfDay,
  format,
  formatISO,
  isWithinInterval,
  subDays,
} from 'date-fns';

export function currentDate(): Date {
  return new Date(Date.now());
}

export function currentDateInYYYYMMDD(): string {
  return format(currentDate(), 'yyyyMMdd');
}

export function toDateISO8601(date: Date | number): string {
  return formatISO(date, { representation: 'date' });
}

export function formatDateWithTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ssXX');
}

/**
 * Returns a date in YYYY-MM-DD format from a full ISO string.
 */
export function getDateIgnoringTime(dateString: string): string {
  return dateString.substring(0, 10);
}

/**
 * "2100-01-01" is used to represent an indefinite end date.
 */
export function isIndefiniteEndDate(dateString: string): boolean {
  return dateString === '2100-01-01';
}

/**
 * Returns if the input date string is "recent". This is used in the script to get new users/feedback entries.
 *
 * "recent" is a dynamic definition - for now, it will be defined as 1 week.
 */
export function isRecent(dateString: string): boolean {
  const date = new Date(dateString);
  const today = currentDate();

  return isWithinInterval(date, {
    start: subDays(today, 7),
    end: today,
  });
}

/**
 * Returns the start and end date range of next week.
 * Each week is defined to start on Monday 00:00:00 and end on Sunday 23:59:59.
 */
export function makeNextWeekInterval(date: Date): {
  start: Date;
  end: Date;
} {
  const oneWeekFromToday = addWeeks(date, 1);
  const nextWeekStart = eachWeekOfInterval(
    { start: oneWeekFromToday, end: oneWeekFromToday },
    { weekStartsOn: 1 },
  )[0];
  const nextWeekEnd = endOfDay(addDays(nextWeekStart, 6));

  return {
    start: nextWeekStart,
    end: nextWeekEnd,
  };
}

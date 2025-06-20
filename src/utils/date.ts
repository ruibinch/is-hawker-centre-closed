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
 * Returns a date in YYYY-MM-DD format from a Unix timestamp.
 */
export function getDateIgnoringTime(timestamp: number): string {
  return new Date(timestamp).toISOString().substring(0, 10);
}

/**
 * Returns if the input date string is "recent", as denoted by the `withinDays` param value.
 */
export function isRecent(dateString: string, withinDays: number): boolean {
  const date = new Date(dateString);
  const today = currentDate();

  return isWithinInterval(date, {
    start: subDays(today, withinDays),
    end: today,
  });
}

/**
 * Returns the start and end date range of this week.
 * Each week is defined to start on Monday 00:00:00 and end on Sunday 23:59:59.
 */
export function makeThisWeekInterval(today: Date): {
  start: Date;
  end: Date;
} {
  const thisWeekStart = eachWeekOfInterval(
    { start: today, end: today },
    { weekStartsOn: 1 },
  )[0];
  const thisWeekEnd = endOfDay(addDays(thisWeekStart, 6));

  return {
    start: thisWeekStart,
    end: thisWeekEnd,
  };
}

/**
 * Returns the start and end date range of next week.
 * Each week is defined to start on Monday 00:00:00 and end on Sunday 23:59:59.
 */
export function makeNextWeekInterval(today: Date): {
  start: Date;
  end: Date;
} {
  const oneWeekFromToday = addWeeks(today, 1);
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

// Hacky dates for representation of various edge cases
export enum HackyDate {
  INDEFINITE_END_DATE = '2100-01-01',
  PERMANENTLY_CLOSED_DATE = '2111-01-01',
  NO_NEXT_CLOSURE_DATE_AVAILABLE = '2122-01-01',
}

export function isIndefiniteEndDate(dateString: string): boolean {
  return dateString === HackyDate.INDEFINITE_END_DATE;
}

export function isPermanentlyClosedDate(dateString: string): boolean {
  return dateString === HackyDate.PERMANENTLY_CLOSED_DATE;
}

export function isNoNextClosureDateAvailable(dateString: string): boolean {
  return dateString === HackyDate.NO_NEXT_CLOSURE_DATE_AVAILABLE;
}

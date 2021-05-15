import { addMonths, format, isToday, isTomorrow, parseISO } from 'date-fns';

import { t } from '../lang';

export function currentDate(): Date {
  return new Date(Date.now());
}

export function currentDateInYYYYMMDD(): string {
  return format(currentDate(), 'yyyyMMdd');
}

export function isWithinDateBounds(
  dateToCompare: Date,
  startDate: Date,
  endDate: Date,
): boolean {
  return (
    dateToCompare.getTime() >= startDate.getTime() &&
    dateToCompare.getTime() <= endDate.getTime()
  );
}

/**
 * Formats the input date in YYYY-MM-DD format to dd-MMM format.
 * If displayTemporalPronoun is set to true, then return "today" or "tomorrow" whenever applicable.
 */
export function formatDateDisplay(
  dateString: string,
  displayTemporalPronoun = false,
): string {
  const date = parseISO(dateString);
  if (displayTemporalPronoun) {
    if (isToday(date)) {
      return t('date.today');
    }
    if (isTomorrow(date)) {
      return t('date.tomorrow');
    }
  }

  return format(date, 'dd\\-MMM');
}

// Returns in YYYY-MM format
export function getNextPeriod(): string {
  const dateInNextPeriod = addMonths(currentDate(), 1);
  return `${dateInNextPeriod.getFullYear()}-${padValueTo2Digits(
    `${dateInNextPeriod.getMonth() + 1}`,
  )}`;
}

/**
 * Reads in a date in DD/MM/YYYY format and returns in YYYY-MM-DD format.
 */
export function toDateISO8601(s: string): string | null {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/g.test(s)) {
    return null;
  }

  const [day, month, year] = s.split('/');
  return `${year}-${padValueTo2Digits(month)}-${padValueTo2Digits(day)}`;
}

export function padValueTo2Digits(value: string): string {
  return `0${value}`.slice(-2);
}

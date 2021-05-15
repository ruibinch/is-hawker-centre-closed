import { addMonths, format, parseISO } from 'date-fns';

export function currentDate(): Date {
  return new Date(Date.now());
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
 */
export function formatDateDisplay(date: string): string {
  return format(parseISO(date), 'dd\\-MMM');
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

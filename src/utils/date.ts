import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

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
 * If displayTemporalPronoun is set to true, then return "yesterday", "today" or "tomorrow" when applicable.
 */
export function formatDateDisplay(
  dateString: string,
  displayTemporalPronoun = false,
): string {
  const date = parseISO(dateString);
  if (displayTemporalPronoun) {
    if (isYesterday(date)) {
      return t('common.time.yesterday');
    }
    if (isToday(date)) {
      return t('common.time.today');
    }
    if (isTomorrow(date)) {
      return t('common.time.tomorrow');
    }
  }

  return format(date, 'dd\\-MMM');
}

import {
  format,
  isToday,
  isTomorrow,
  isWithinInterval,
  isYesterday,
  parseISO,
  subDays,
} from 'date-fns';

import { t } from '../lang';

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
 * Formats the input date in YYYY-MM-DD format to dd-MMM format.
 * If shouldDisplayTemporalPronoun is set to true, then return "yesterday", "today" or "tomorrow" when applicable.
 */
export function formatDateDisplay(
  dateString: string,
  shouldDisplayTemporalPronoun = false,
): string {
  const date = parseISO(dateString);
  if (shouldDisplayTemporalPronoun) {
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

  return format(date, t('common.time.date-format'));
}

export function currentDate(): Date {
  return new Date(Date.now());
}

export function currentDateInYYYYMMDD(): string {
  return format(currentDate(), 'yyyyMMdd');
}

export function formatDateWithTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ssXX');
}

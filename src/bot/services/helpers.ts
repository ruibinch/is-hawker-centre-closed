import {
  endOfDay,
  format,
  isPast,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns';

import type { Closure } from '../../models/Closure';
import { t } from '../lang';

/**
 * Returns the closure entry that is the next to occur w.r.t. the current date (includes closures occurring today).
 */
export function getNextOccurringClosure(
  closures: Closure[],
): Closure | undefined {
  const closuresSorted = sortInDateAscThenAlphabeticalOrder(closures);

  const closuresSortedAndFiltered = closuresSorted.filter(
    (closure) => !isPast(endOfDay(parseISO(closure.endDate))),
  );

  return closuresSortedAndFiltered[0];
}

/**
 * Formats the input date in YYYY-MM-DD format or of Date type to dd-MMM format.
 * If shouldDisplayTemporalPronoun is set to true, then return "yesterday", "today" or "tomorrow" when applicable.
 */
export function formatDateDisplay(
  dateRaw: string | Date,
  options?: {
    shouldDisplayTemporalPronoun?: boolean;
    shouldShowYear?: boolean;
  },
): string {
  const date = dateRaw instanceof Date ? dateRaw : parseISO(dateRaw);
  const shouldDisplayTemporalPronoun =
    options?.shouldDisplayTemporalPronoun ?? false;
  const shouldShowYear = options?.shouldShowYear ?? false;

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

  return format(
    date,
    shouldShowYear
      ? t('common.time.date-format.with-year')
      : t('common.time.date-format'),
  );
}

/**
 * Sorting logic:
 * 1. By ascending order of start date, then
 * 2. By ascending order of end date, then
 * 3. Alphabetical order of hawker centre name
 */
export function sortInDateAscThenAlphabeticalOrder(
  closures: Closure[],
): Closure[] {
  return [...closures].sort((a, b) => {
    const aStartDate = parseISO(a.startDate);
    const aEndDate = parseISO(a.endDate);
    const bStartDate = parseISO(b.startDate);
    const bEndDate = parseISO(b.endDate);

    return (
      aStartDate.getTime() - bStartDate.getTime() ||
      aEndDate.getTime() - bEndDate.getTime() ||
      a.name.localeCompare(b.name)
    );
  });
}

export function sortInAlphabeticalOrder(closures: Closure[]): Closure[] {
  return [...closures].sort((a, b) => a.name.localeCompare(b.name));
}

export function isCallbackQuery(s: string) {
  const [, queryData] = s.split('::');
  return queryData && queryData.startsWith('$');
}

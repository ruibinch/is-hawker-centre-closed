import { endOfDay, isPast, parseISO } from 'date-fns';

import type { Closure } from '../models/Closure';

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

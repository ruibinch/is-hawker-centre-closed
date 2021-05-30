import {
  addDays,
  differenceInCalendarMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';

import { getAllClosures } from '../../models/Closure';
import { Closure } from '../../models/types';
import { currentDate, isWithinDateBounds } from '../../utils/date';
import { extractSearchModifier } from './searchModifier';
import { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(term: string): Promise<SearchResponse> {
  const searchParams = parseSearchTerm(term);
  const { keyword, modifier } = searchParams;

  const getAllClosuresResponse = await getAllClosures();
  if (!getAllClosuresResponse.success) return { success: false };
  const closuresAll = getAllClosuresResponse.output;

  const closuresFilteredByKeyword = filterByKeyword(closuresAll, keyword);

  const closuresFilteredByKeywordAndDate = filterByDate(
    closuresFilteredByKeyword,
    modifier,
  );

  const closures = sortInDateAscThenAlphabeticalOrder(
    closuresFilteredByKeywordAndDate,
  );

  return {
    success: true,
    params: searchParams,
    closures,
  };
}

/**
 * Splits the search term up into 2 components:
 * 1. Keyword
 * 2. Modifier
 */
function parseSearchTerm(term: string): SearchObject {
  const modifierResult = extractSearchModifier(term);

  if (!modifierResult) {
    return {
      keyword: term,
      modifier: 'today', // defaults to today if no modifier
    };
  }

  const { modifier, index: modifierStartIndex } = modifierResult;
  return {
    keyword: term.slice(0, modifierStartIndex).trim(),
    modifier,
  };
}

/**
 * Filters the list of closures by keyword matching the hawker centre name or secondary name.
 * Searches across the individual words in the input keyword.
 */
function filterByKeyword(closures: Closure[], keyword: string) {
  if (keyword === '') {
    return closures;
  }

  const searchKeywords = keyword.split(' ');

  return closures.filter((closure) =>
    searchKeywords.every((searchKeyword) => {
      const filterRegex = new RegExp(`\\b${searchKeyword.toLowerCase()}`);
      return (
        filterRegex.test(closure.name.toLowerCase()) ||
        (closure.nameSecondary &&
          filterRegex.test(closure.nameSecondary.toLowerCase()))
      );
    }),
  );
}

/**
 * Filters the list of closures by date based on the search modifier.
 */
function filterByDate(closures: Closure[], modifier: SearchModifier) {
  const currDate = currentDate();

  return closures.filter((closure) => {
    const startDate = parseISO(closure.startDate);
    const endDate = parseISO(closure.endDate);

    return (() => {
      if (modifier === 'today') {
        return isWithinDateBounds(currDate, startDate, endDate);
      }
      if (modifier === 'tomorrow') {
        const tomorrowDate = addDays(currDate, 1);
        return isWithinDateBounds(tomorrowDate, startDate, endDate);
      }
      if (modifier === 'month') {
        return isSameMonth(currDate, startDate);
      }
      if (modifier === 'nextMonth') {
        return differenceInCalendarMonths(startDate, currDate) === 1;
      }
      /* istanbul ignore next */
      return false;
    })();
  });
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

import {
  addDays,
  differenceInCalendarMonths,
  isSameMonth,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Err, Ok, Result } from 'ts-results';

import { CustomError } from '../../errors/CustomError';
import { Closure, getAllClosures } from '../../models/Closure';
import { notEmpty } from '../../utils';
import { currentDate, isWithinDateBounds } from '../../utils/date';
import {
  getNextOccurringClosure,
  sortInAlphabeticalOrder,
  sortInDateAscThenAlphabeticalOrder,
} from '../utils';
import { extractSearchModifier } from './searchModifier';
import { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(
  term: string,
): Promise<Result<SearchResponse, CustomError>> {
  const searchParams = parseSearchTerm(term);
  const { keyword, modifier } = searchParams;

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.err) return Err(getAllClosuresResponse.val);
  const closuresAll = getAllClosuresResponse.val;

  const closuresFilteredByKeyword = filterByKeyword(closuresAll, keyword);

  if (closuresFilteredByKeyword.length === 0) {
    return Ok({
      params: searchParams,
      hasResults: false,
      closures: [],
    });
  }

  const closures = (() => {
    if (modifier === 'next') {
      const nextClosuresForEachHC = getNextClosuresForEachHC(
        closuresFilteredByKeyword,
      );

      return sortInAlphabeticalOrder(nextClosuresForEachHC);
    }

    const closuresFilteredByKeywordAndDate = filterByDate(
      closuresFilteredByKeyword,
      modifier,
    );

    return sortInDateAscThenAlphabeticalOrder(closuresFilteredByKeywordAndDate);
  })();

  return Ok({
    params: searchParams,
    hasResults: true,
    closures,
  });
}

/**
 * Splits the search term up into 2 components:
 * 1. Keyword
 * 2. Modifier
 */
function parseSearchTerm(term: string): SearchObject {
  const modifierResult = extractSearchModifier(term);

  if (modifierResult.err) {
    return {
      keyword: term,
      modifier: 'today', // defaults to today if no modifier
    };
  }

  const { modifier, index: modifierStartIndex } = modifierResult.val;
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
  const currDate = startOfDay(currentDate());

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
        return (
          isWithinDateBounds(currDate, startDate, endDate) ||
          isSameMonth(currDate, startDate)
        );
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
 * Returns a list of upcoming closures for each hawker centre in the input closures list.
 */
function getNextClosuresForEachHC(closures: Closure[]) {
  const closuresByHC = closures.reduce(
    (obj: Record<string, Closure[]>, closureEntry) => {
      obj[closureEntry.hawkerCentreId] = [
        ...(obj[closureEntry.hawkerCentreId] ?? []),
        closureEntry,
      ];
      return obj;
    },
    {},
  );

  const nextClosuresForEachHC = Object.values(closuresByHC)
    .map((closuresList) => getNextOccurringClosure(closuresList))
    .filter(notEmpty);

  return nextClosuresForEachHC;
}

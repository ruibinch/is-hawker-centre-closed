import {
  addDays,
  differenceInCalendarMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';

import { getAllResults } from '../../models/Result';
import { Result } from '../../models/types';
import {
  currentDate,
  getNextPeriod,
  isWithinDateBounds,
} from '../../utils/date';
import { extractSearchModifier } from './searchModifier';
import { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(term: string): Promise<SearchResponse> {
  const searchParams = parseSearchTerm(term);
  const { keyword, modifier } = searchParams;

  const getAllResultsResponse = await getAllResults();
  if (!getAllResultsResponse.success) return { success: false };
  const resultsAll = getAllResultsResponse.output;

  const isDataPresent = checkIsDataPresent(resultsAll, modifier);
  if (!isDataPresent) {
    return {
      success: true,
      params: searchParams,
      isDataPresent: false,
      results: [],
    };
  }

  const resultsFilteredByKeyword = filterByKeyword(resultsAll, keyword);

  const resultsFilteredByKeywordAndDate = filterByDate(
    resultsFilteredByKeyword,
    modifier,
  );

  const results = sortInDateAscThenAlphabeticalOrder(
    resultsFilteredByKeywordAndDate,
  );

  return {
    success: true,
    params: searchParams,
    results,
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
 * If modifier is "nextMonth", check if the data for that time period is present first.
 */
// TODO: relook at the necessity of this function
function checkIsDataPresent(results: Result[], modifier: SearchModifier) {
  if (modifier !== 'nextMonth') return true;

  // extract the YYYY-MM portion of the dates and remove duplicates
  const timePeriods = [
    ...new Set(results.map((rseult) => rseult.startDate.slice(0, 7))),
  ];
  const nextPeriod = getNextPeriod();

  return timePeriods.includes(nextPeriod);
}

/**
 * Filters the list of results by keyword matching the hawker centre name or secondary name.
 * Searches across the individual words in the input keyword.
 */
function filterByKeyword(results: Result[], keyword: string) {
  if (keyword === '') {
    return results;
  }

  const searchKeywords = keyword.split(' ');

  return results.filter((result) =>
    searchKeywords.every((searchKeyword) => {
      const filterRegex = new RegExp(`\\b${searchKeyword.toLowerCase()}`);
      return (
        filterRegex.test(result.name.toLowerCase()) ||
        (result.nameSecondary &&
          filterRegex.test(result.nameSecondary.toLowerCase()))
      );
    }),
  );
}

/**
 * Filters the list of results by date based on the search modifier.
 */
function filterByDate(results: Result[], modifier: SearchModifier) {
  const currDate = currentDate();

  return results.filter((result) => {
    const startDate = parseISO(result.startDate);
    const endDate = parseISO(result.endDate);

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
  results: Result[],
): Result[] {
  return [...results].sort((a, b) => {
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

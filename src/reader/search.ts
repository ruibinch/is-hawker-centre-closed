import {
  addDays,
  differenceInCalendarMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { currentDate, getNextPeriod, isWithinDateBounds } from '../common/date';
import { getTableData } from '../common/dynamodb';
import { Result } from '../dataCollection/types';
import { extractSearchModifier } from './searchModifier';
import { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(
  term: string,
): Promise<SearchResponse | null> {
  const searchParams = parseSearchTerm(term);
  const { keyword, modifier } = searchParams;

  return getTableData()
    .then((response) => {
      const items = response.Items as Result[];

      const isDataPresent = checkIsDataPresent(items, modifier);
      if (!isDataPresent) {
        return {
          params: searchParams,
          isDataPresent: false,
          results: [],
        };
      }

      const resultsFilteredByKeyword = filterByKeyword(items, keyword);

      const resultsFilteredByKeywordAndDate = filterByDate(
        resultsFilteredByKeyword,
        modifier,
      );

      const results = sortInDateAscThenAlphabeticalOrder(
        resultsFilteredByKeywordAndDate,
      );

      return {
        params: searchParams,
        results,
      };
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
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
      modifier: SearchModifier.today, // defaults to today if no modifier
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
function checkIsDataPresent(items: Result[], modifier: SearchModifier) {
  if (modifier !== SearchModifier.nextMonth) return true;

  // extract the YYYY-MM portion of the dates and remove duplicates
  const timePeriods = [
    ...new Set(items.map((item) => item.startDate.slice(0, 7))),
  ];
  const nextPeriod = getNextPeriod();

  return timePeriods.includes(nextPeriod);
}

/**
 * Filters the list of items by keyword matching the hawker centre name.
 */
function filterByKeyword(items: Result[], keyword: string) {
  if (keyword === '') {
    return items;
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return items.filter((item) => filterRegex.test(item.name.toLowerCase()));
}

/**
 * Filters the list of items by date based on the search modifier.
 */
function filterByDate(items: Result[], modifier: SearchModifier) {
  const currDate = currentDate();

  return items.filter((item) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);

    return (() => {
      if (modifier === SearchModifier.today) {
        return isWithinDateBounds(currDate, startDate, endDate);
      }
      if (modifier === SearchModifier.tomorrow) {
        const tomorrowDate = addDays(currDate, 1);
        return isWithinDateBounds(tomorrowDate, startDate, endDate);
      }
      if (modifier === SearchModifier.month) {
        return isSameMonth(currDate, startDate);
      }
      if (modifier === SearchModifier.nextMonth) {
        return differenceInCalendarMonths(startDate, currDate) === 1;
      }
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
function sortInDateAscThenAlphabeticalOrder(items: Result[]) {
  return [...items].sort((a, b) => {
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

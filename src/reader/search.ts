import {
  addDays,
  differenceInCalendarMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { currentDate, isWithinDateBounds } from '../common/date';
import { getTableData } from '../common/dynamodb';
import { Result } from '../parser/types';
import { extractSearchModifier } from './searchModifier';
import { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(
  term: string,
): Promise<SearchResponse | null> {
  const { keyword, modifier } = parseSearchTerm(term);

  return getTableData()
    .then((response) => {
      const items = response.Items as Result[];

      const resultsFilteredByKeyword = filterByKeyword(items, keyword);

      const resultsFilteredByKeywordAndDate = filterByDate(
        resultsFilteredByKeyword,
        modifier,
      );

      const results = sortInDateAscThenAlphabeticalOrder(
        resultsFilteredByKeywordAndDate,
      );

      const searchResponse: SearchResponse = {
        params: {
          keyword,
          modifier,
        },
        results,
      };
      return searchResponse;
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
 * Filters the list of items by keyword matching the hawker centre name.
 */
function filterByKeyword(items: Result[], keyword: string) {
  if (keyword === '') {
    return items;
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return items.filter((item) =>
    filterRegex.test(item.hawkerCentre.toLowerCase()),
  );
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
      a.hawkerCentre.localeCompare(b.hawkerCentre)
    );
  });
}

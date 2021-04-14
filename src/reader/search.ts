import { APIGatewayProxyHandler } from 'aws-lambda';
import { isSameMonth, parseISO } from 'date-fns';
import { getTableData } from '../common/aws';
import { currentDate, isWithinDateBounds } from '../common/date';
import { parseToEnum } from '../common/enum';
import { Result } from '../parser/types';
import {
  SearchQuery,
  SearchModifier,
  SearchObject,
  SearchResponse,
} from './types';
import { makeCallbackWrapper, makeResponseBody } from './utils';

export const handler: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  const callbackWrapper = makeCallbackWrapper(callback);
  const { term } = event.queryStringParameters as SearchQuery;

  await processSearch(term).then((searchResponse) => {
    if (searchResponse === null) {
      callbackWrapper(400);
    } else {
      callbackWrapper(200, JSON.stringify(searchResponse));
    }
  });

  return makeResponseBody(502);
};

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

function parseSearchTerm(term: string): SearchObject {
  const termSplit = term.split(' ');
  const lastWord = termSplit.slice(-1).join('');

  const modifier = parseToEnum(SearchModifier, lastWord);
  const keyword = modifier ? termSplit.slice(0, -1).join(' ') : term;
  return { keyword, modifier: modifier ?? SearchModifier.today };
}

function filterByKeyword(items: Result[], keyword: string) {
  if (keyword === '') {
    return items;
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return items.filter((item) =>
    filterRegex.test(item.hawkerCentre.toLowerCase()),
  );
}

function filterByDate(items: Result[], modifier: SearchModifier) {
  const currDate = currentDate();

  return items.filter((item) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);

    return modifier === SearchModifier.today
      ? isWithinDateBounds(currDate, startDate, endDate)
      : isSameMonth(currDate, startDate);
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

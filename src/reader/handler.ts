import { APIGatewayProxyHandler } from 'aws-lambda';
import { isSameMonth, parseISO } from 'date-fns';
import { getTableData } from '../common/aws';
import { currentDate, isWithinDateBounds } from '../common/date';
import { parseToEnum } from '../common/enum';
import { Result } from '../parser/types';
import { Query, SearchModifier, SearchObject } from './types';
import { makeCallbackWrapper, makeResponseBody } from './utils';

export const searchByHawkerCentre: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  const callbackWrapper = makeCallbackWrapper(callback);
  const { term } = event.queryStringParameters as Query;

  const { keyword, modifier } = parseSearchTerm(term);

  await getTableData()
    .then((response) => {
      const items = response.Items as Result[];

      const resultsFilteredByKeyword = filterByKeyword(items, keyword);

      const resultsFilteredByKeywordAndDate = filterByDate(
        resultsFilteredByKeyword,
        modifier,
      );

      callbackWrapper(200, JSON.stringify(resultsFilteredByKeywordAndDate));
    })
    .catch((error) => {
      console.log(error);
      callbackWrapper(400);
    });

  return makeResponseBody(502);
};

function parseSearchTerm(term: string): SearchObject {
  const termSplit = term.split(' ');
  const lastWord = termSplit.slice(-1).join('');

  const modifier = parseToEnum(SearchModifier, lastWord);
  const keyword = modifier ? termSplit.slice(0, -1).join(' ') : term;
  return { keyword, modifier };
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

function filterByDate(items: Result[], modifier?: SearchModifier) {
  const currDate = currentDate();
  const timePeriod = modifier ?? SearchModifier.today;

  return items.filter((item) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);

    return timePeriod === SearchModifier.today
      ? isWithinDateBounds(currDate, startDate, endDate)
      : isSameMonth(currDate, startDate);
  });
}

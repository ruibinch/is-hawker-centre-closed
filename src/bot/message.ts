import { format, parseISO } from 'date-fns';
import { Result } from '../parser/types';
import { SearchModifier, SearchResponse } from '../reader/types';

export function makeMessage(searchResponse: SearchResponse): string {
  const {
    params: { keyword, modifier },
    results,
  } = searchResponse;
  let reply = '';

  if (results.length === 0) {
    reply = `All good\\! No hawker centres ${makeKeywordSnippet(
      keyword,
    )}are undergoing cleaning ${makeTimePeriodSnippet(modifier)}\\.`;
  } else {
    if (keyword === '') {
      reply += `There are ${makeNumResultsSnippet(
        results,
      )} hawker centres that are closed ${makeTimePeriodSnippet(modifier)}:`;
    } else {
      reply += `Here are the hawker centres ${makeKeywordSnippet(
        keyword,
      )}that are closed ${makeTimePeriodSnippet(modifier)}:`;
    }
    reply += '\n\n';

    results.forEach((result) => {
      reply += `*${result.hawkerCentre}*\n`;
      reply += `${formatDate(result.startDate)} to ${formatDate(
        result.endDate,
      )}\n\n`;
    });
  }

  return reply;
}

function makeKeywordSnippet(keyword: string) {
  return keyword.length > 0 ? `containing the keyword *${keyword}* ` : '';
}

function makeTimePeriodSnippet(modifier: SearchModifier) {
  switch (modifier) {
    case SearchModifier.today:
      return 'today';
    case SearchModifier.tomorrow:
      return 'tomorrow';
    case SearchModifier.month:
      return 'this month';
    case SearchModifier.nextMonth:
      return 'next month';
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeNumResultsSnippet(results: Result[]) {
  return `*${results.length}*`;
}

function formatDate(date: string) {
  return format(parseISO(date), 'dd\\-MMM');
}

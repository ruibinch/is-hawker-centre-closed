import { format, parseISO } from 'date-fns';
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
    reply += `Here are the hawker centres ${makeKeywordSnippet(
      keyword,
    )}that are closed ${makeTimePeriodSnippet(modifier)}:\n\n`;

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
  return modifier === SearchModifier.today ? 'today' : 'this month';
}

function formatDate(date: string) {
  return format(parseISO(date), 'dd\\-MMM');
}

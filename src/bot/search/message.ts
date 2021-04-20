import { format, parseISO } from 'date-fns';
import { ClosureReason, Result } from '../../dataCollection/types';
import { SearchModifier, SearchResponse } from '../../reader/types';

export function makeMessage(searchResponse: SearchResponse): string {
  const {
    params: { keyword, modifier },
    isDataPresent,
    results,
  } = searchResponse;
  let reply = '';

  if (results.length === 0) {
    if (isDataPresent === false && modifier === SearchModifier.nextMonth) {
      reply =
        'No data is available for next month yet, check back again in a while\\!';
    } else {
      reply = `All good\\! No hawker centres ${makeKeywordSnippet(
        keyword,
      )}${makeTemporalVerbSnippet(
        modifier,
      )} undergoing cleaning ${makeTimePeriodSnippet(modifier)}\\.`;
    }
  } else {
    if (keyword === '') {
      reply = `There are ${makeNumResultsSnippet(
        results,
      )} hawker centres that ${makeTemporalVerbSnippet(
        modifier,
      )} closed ${makeTimePeriodSnippet(modifier)}:`;
    } else {
      reply = `Here are the hawker centres ${makeKeywordSnippet(
        keyword,
      )}that ${makeTemporalVerbSnippet(
        modifier,
      )} closed ${makeTimePeriodSnippet(modifier)}:`;
    }
    reply += '\n\n';

    results.forEach((result) => {
      reply +=
        `*${result.name}*\n` +
        `${formatDate(result.startDate)} to ${formatDate(
          result.endDate,
        )}${makeClosureReasonSnippet(result.reason)}\n\n`;
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

function makeTemporalVerbSnippet(modifier: SearchModifier) {
  switch (modifier) {
    case SearchModifier.today:
    case SearchModifier.month:
      return 'are';
    case SearchModifier.tomorrow:
    case SearchModifier.nextMonth:
      return 'will be';
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case ClosureReason.renovation:
      return ' _\\(long\\-term renovation works\\)_';
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

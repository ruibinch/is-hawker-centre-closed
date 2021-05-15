import { t } from '../../lang';
import { ClosureReason, Result } from '../../models/types';
import { formatDateDisplay } from '../../utils/date';
import { SearchModifier, SearchResponse } from './types';

export function makeMessage(searchResponse: SearchResponse): string {
  const {
    params: { keyword, modifier },
    isDataPresent,
    results,
  } = searchResponse;
  let reply = '';

  if (results.length === 0) {
    if (isDataPresent === false && modifier === SearchModifier.nextMonth) {
      reply = t('search.error.next-month-data-unavailable');
    } else {
      reply = t('search.no-hawker-centres-closed', {
        keywordSnippet: makeKeywordSnippet(keyword),
        temporalVerbSnippet: makeTemporalVerbSnippet(modifier),
        timePeriodSnippet: makeTimePeriodSnippet(modifier),
      });
    }
  } else {
    if (keyword === '') {
      reply = t('search.hawker-centres-closed.without-keyword', {
        numResultsSnippet: makeNumResultsSnippet(results),
        temporalVerbSnippet: makeTemporalVerbSnippet(modifier),
        timePeriodSnippet: makeTimePeriodSnippet(modifier),
      });
    } else {
      reply = t('search.hawker-centres-closed.with-keyword', {
        keywordSnippet: makeKeywordSnippet(keyword),
        temporalVerbSnippet: makeTemporalVerbSnippet(modifier),
        timePeriodSnippet: makeTimePeriodSnippet(modifier),
      });
    }

    results.forEach((result) => {
      reply += t('search.item', {
        hcName: result.name,
        startDate: formatDateDisplay(result.startDate),
        endDate: formatDateDisplay(result.endDate),
        closureReasonSnippet: makeClosureReasonSnippet(result.reason),
      });
    });
  }

  return reply;
}

function makeKeywordSnippet(keyword: string) {
  return keyword.length > 0 ? t('search.snippet.keyword', { keyword }) : '';
}

function makeTimePeriodSnippet(modifier: SearchModifier) {
  switch (modifier) {
    case SearchModifier.today:
      return t('search.snippet.time-period.today');
    case SearchModifier.tomorrow:
      return t('search.snippet.time-period.tomorrow');
    case SearchModifier.month:
      return t('search.snippet.time-period.this-month');
    case SearchModifier.nextMonth:
      return t('search.snippet.time-period.next-month');
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeTemporalVerbSnippet(modifier: SearchModifier) {
  switch (modifier) {
    case SearchModifier.today:
    case SearchModifier.month:
      return t('search.snippet.temporal.are');
    case SearchModifier.tomorrow:
    case SearchModifier.nextMonth:
      return t('search.snippet.temporal.will-be');
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case ClosureReason.renovation:
      return t('search.snippet.closure-reason.long-term-renovation-works');
    default:
      return '';
  }
}

function makeNumResultsSnippet(results: Result[]) {
  return t('search.snippet.num-results', {
    numResults: results.length,
  });
}

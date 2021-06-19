import { t } from '../../lang';
import { ClosureReason } from '../../models/types';
import { makeClosurePeriodSnippet } from '../message';
import { SearchModifier, SearchResponse } from './types';

export function makeMessage(searchResponse: SearchResponse): string {
  const {
    params: { keyword, modifier },
    closures,
  } = searchResponse;
  let reply = '';

  if (closures.length === 0) {
    reply = t(
      isSearchModifierInFuture(modifier)
        ? 'search.no-hawker-centres-closed.future'
        : 'search.no-hawker-centres-closed.present',
      {
        keyword: makeKeywordSnippet(keyword),
        timePeriod: makeTimePeriodSnippet(modifier),
      },
    );
  } else {
    if (keyword === '') {
      const messageString = (() => {
        if (closures.length === 1) {
          return isSearchModifierInFuture(modifier)
            ? 'search.hawker-centres-closed.without-keyword.singular.future'
            : 'search.hawker-centres-closed.without-keyword.singular.present';
        }

        return isSearchModifierInFuture(modifier)
          ? 'search.hawker-centres-closed.without-keyword.plural.future'
          : 'search.hawker-centres-closed.without-keyword.plural.present';
      })();

      reply = t(messageString, {
        numHC: closures.length,
        timePeriod: makeTimePeriodSnippet(modifier),
      });
    } else {
      reply = t(
        isSearchModifierInFuture(modifier)
          ? 'search.hawker-centres-closed.with-keyword.future'
          : 'search.hawker-centres-closed.with-keyword.present',
        {
          keyword: makeKeywordSnippet(keyword),
          timePeriod: makeTimePeriodSnippet(modifier),
        },
      );
    }

    reply += closures
      .map((closure) =>
        t('common.hc-item', {
          hcName: closure.name,
          closurePeriod: makeClosurePeriodSnippet(
            closure.startDate,
            closure.endDate,
          ),
          closureReason: makeClosureReasonSnippet(closure.reason),
        }),
      )
      .join('\n\n');
  }

  return reply;
}

function makeKeywordSnippet(keyword: string) {
  return keyword.length > 0 ? t('search.snippet.keyword', { keyword }) : '';
}

function makeTimePeriodSnippet(modifier: SearchModifier) {
  switch (modifier) {
    case 'today':
      return t('common.time.today');
    case 'tomorrow':
      return t('common.time.tomorrow');
    case 'month':
      return t('common.time.this-month');
    case 'nextMonth':
      return t('common.time.next-month');
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case 'others':
      return t('search.snippet.closure-reason', {
        reason: t('common.closure-reason.others'),
      });
    default:
      return '';
  }
}

function isSearchModifierInFuture(modifier: SearchModifier) {
  switch (modifier) {
    case 'tomorrow':
    case 'nextMonth':
      return true;
    case 'today':
    case 'month':
    default:
      return false;
  }
}

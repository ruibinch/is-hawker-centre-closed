import type { Closure } from '../../../models/Closure';
import { currentDate, makeNextWeekInterval } from '../../../utils/date';
import { t } from '../../lang';
import { TelegramSendMessageParams } from '../../telegram';
import { formatDateDisplay } from '../helpers';
import { makeClosureListItem } from '../message';
import { isSearchModifierTimeBased } from './searchModifier';
import type { SearchModifier, SearchResponse } from './types';

export function makeMessage(
  searchResponse: SearchResponse,
): TelegramSendMessageParams {
  const {
    params: { modifier, keyword },
    hasResults,
  } = searchResponse;

  const messageParams: TelegramSendMessageParams = { text: '' };

  if (!hasResults) {
    messageParams.text =
      keyword.toLowerCase() === 'next'
        ? t('search.no-hawker-centres-exist.keyword-next')
        : t('search.no-hawker-centres-exist', {
            keyword: makeKeywordSnippet(keyword),
          });
  } else {
    messageParams.text = (
      isSearchModifierTimeBased(modifier)
        ? makeMessageForTimeBasedModifier
        : makeMessageForNonTimeBasedModifier
    )(searchResponse);
  }
  return messageParams;
}

export function makeSearchUnexpectedErrorMessage(): string {
  return t('search.error');
}

function makeMessageForTimeBasedModifier(
  searchResponse: SearchResponse,
): string {
  const {
    params: { keyword, modifier },
    closures,
  } = searchResponse;
  let messageText = '';

  if (closures.length === 0) {
    messageText = t(
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

      messageText = t(messageString, {
        numHC: closures.length,
        timePeriod: makeTimePeriodSnippet(modifier),
      });
    } else {
      messageText = t(
        isSearchModifierInFuture(modifier)
          ? 'search.hawker-centres-closed.with-keyword.future'
          : 'search.hawker-centres-closed.with-keyword.present',
        {
          keyword: makeKeywordSnippet(keyword),
          timePeriod: makeTimePeriodSnippet(modifier),
        },
      );
    }

    messageText += makeClosuresListOutput(closures);
  }

  return messageText;
}

function makeMessageForNonTimeBasedModifier(
  searchResponse: SearchResponse,
): string {
  const {
    params: { keyword },
    closures,
  } = searchResponse;

  let messageText = t('search.hawker-centres-next-closure', {
    keyword: makeKeywordSnippet(keyword),
  });

  messageText += makeClosuresListOutput(closures);

  return messageText;
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
    case 'nextWeek': {
      const nextWeekInterval = makeNextWeekInterval(currentDate());

      return `${t('common.time.next-week')} \\(${t('common.time.time-period', {
        startDate: formatDateDisplay(nextWeekInterval.start),
        endDate: formatDateDisplay(nextWeekInterval.end),
      })}\\)`;
    }
    case 'month':
      return t('common.time.this-month');
    case 'nextMonth':
      return t('common.time.next-month');
    /* istanbul ignore next */
    default:
      return '';
  }
}

function makeClosuresListOutput(closures: Closure[]) {
  return closures.map((closure) => makeClosureListItem(closure)).join('\n\n');
}

function isSearchModifierInFuture(modifier: SearchModifier) {
  switch (modifier) {
    case 'tomorrow':
    case 'nextWeek':
    case 'nextMonth':
      return true;
    case 'today':
    case 'month':
    default:
      return false;
  }
}

import type { Closure } from '../../../models/Closure';
import { currentDate, makeNextWeekInterval } from '../../../utils/date';
import { t } from '../../lang';
import {
  TelegramInlineKeyboardButton,
  TelegramSendMessageParams,
} from '../../telegram';
import { formatDateDisplay } from '../helpers';
import { makeClosureListItem } from '../message';
import { isSearchModifierTimeBased } from './searchModifier';
import type { SearchModifier, SearchResponse } from './types';

const MAX_RESULTS_PER_PAGE = 8;

export function makeMessage(
  searchResponse: SearchResponse,
  currPage: number,
): TelegramSendMessageParams {
  const {
    params: { modifier, keyword },
    hasResults,
    closures,
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

    // const listPagination = makeClosuresListPagination(closures, currPage);
    const listPagination = undefined;
    if (listPagination) {
      messageParams.reply_markup = { inline_keyboard: [listPagination] };
    }
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

function makeClosuresListPagination(
  closures: Closure[],
  currPage: number,
): Array<TelegramInlineKeyboardButton> | undefined {
  if (closures.length <= MAX_RESULTS_PER_PAGE) return undefined;

  const numPages = Math.ceil(closures.length / MAX_RESULTS_PER_PAGE);

  const paginationSet = new Set([1, numPages]);
  paginationSet.add(currPage);
  paginationSet.add(currPage - 1);
  paginationSet.add(currPage + 1);

  const pagination = [...Array.from(paginationSet).filter((v) => v > 0)].sort(
    (a, b) => a - b,
  );
  return pagination.map((pageNumber) => ({
    text: `${pageNumber}`,
    callback_data: `$searchPagination ${pageNumber}`,
  }));
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

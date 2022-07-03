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

const MAX_RESULTS_PER_PAGE = 10;

export function makeSearchResponseMessage(
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
    const messageHeader = (
      isSearchModifierTimeBased(modifier)
        ? makeMessageHeaderForTimeBasedModifier
        : makeMessageHeaderForNonTimeBasedModifier
    )(searchResponse);
    const messageContent = makeClosuresListOutput(closures, currPage);
    messageParams.text = messageHeader + messageContent;

    const listPagination = makeClosuresListPagination(closures, currPage);
    if (listPagination) {
      messageParams.reply_markup = { inline_keyboard: [listPagination] };
    }
  }
  return messageParams;
}

export function makeSearchUnexpectedErrorMessage(): string {
  return t('search.error');
}

function makeMessageHeaderForTimeBasedModifier(
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
  }

  return messageText;
}

function makeMessageHeaderForNonTimeBasedModifier(
  searchResponse: SearchResponse,
): string {
  const {
    params: { keyword },
  } = searchResponse;

  return t('search.hawker-centres-next-closure', {
    keyword: makeKeywordSnippet(keyword),
  });
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

  const pagination = [
    ...Array.from(paginationSet).filter((v) => v >= 1 && v <= numPages),
  ].sort((a, b) => a - b);
  return pagination.map((page) => ({
    text: (() => {
      if (page === currPage) return `[ ${page} ]`;
      if (page === 1) return `« ${page}`;
      if (page === numPages) return `${page} »`;
      if (page === currPage - 1) return `‹ ${page}`;
      if (page === currPage + 1) return `${page} ›`;
      return `${page}`; // should never reach here
    })(),
    callback_data: `$searchPagination ${page}`,
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

function makeClosuresListOutput(closures: Closure[], currPage: number) {
  const displayStartIndex = (currPage - 1) * MAX_RESULTS_PER_PAGE;
  const displayEndIndex = currPage * MAX_RESULTS_PER_PAGE;

  return closures
    .filter((_, idx) => idx >= displayStartIndex && idx < displayEndIndex)
    .map((closure, idx) =>
      makeClosureListItem(closure, displayStartIndex + idx + 1),
    )
    .join('\n\n');
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

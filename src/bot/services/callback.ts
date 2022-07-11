import { Result } from '../../lib/Result';
import { t } from '../lang';
import { TelegramCallbackQuery } from '../telegram';
import { ServiceCallbackResponse } from '../types';
import { runSearchWithPagination } from './search';

export async function handleCallbackQuery({
  userId,
  callbackQuery,
}: {
  userId: number;
  callbackQuery: TelegramCallbackQuery;
}): Promise<ServiceCallbackResponse> {
  const { message: originalMessage, data: queryData } = callbackQuery;

  // If originalMessage is undefined, message content is not available anymore as message is too old
  // ref: https://core.telegram.org/bots/api#callbackquery
  if (!originalMessage) {
    // this flow will never be reached as there is an early return when extractTelegramMessage returns null
    // TODO: possibly revise this behaviour
    return Result.Err(t('callback.error.message-too-old'));
  }
  if (!queryData) {
    return Result.Err(t('callback.error.no-data-found'));
  }

  const [queryCommand, queryDataDetails] = queryData.split(' ');

  if (queryCommand === '$searchPagination') {
    if (queryDataDetails === 'null') {
      return Result.Err();
    }

    const searchResult = await runSearchWithPagination({
      userId,
      originalMessageTimestamp: originalMessage.date,
      pageNum: Number(queryDataDetails),
    });

    if (searchResult.isErr) {
      return Result.Err(t('callback.error.returning-search-results'));
    }
    return Result.Ok({
      ...searchResult.value,
      editMessageId: originalMessage.message_id,
    });
  }

  return Result.Err(t('callback.error.handling-query'));
}

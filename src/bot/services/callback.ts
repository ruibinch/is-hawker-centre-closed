import { Result } from '../../lib/Result';
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
  if (!originalMessage || !queryData) {
    return Result.Err();
  }

  const [queryCommand, queryDataDetails] = queryData.split(' ');

  if (queryCommand === '$searchPagination') {
    const pageNum = Number(queryDataDetails);
    const searchResult = await runSearchWithPagination({
      userId,
      originalMessageDate: originalMessage.date,
      pageNum,
    });

    if (searchResult.isOk) {
      return Result.Ok({
        ...searchResult.value,
        editMessageId: originalMessage.message_id,
      });
    }
    // TODO: error handling: show toast?
  }

  return Result.Err();
}

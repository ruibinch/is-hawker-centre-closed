import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../../utils/types';
import type { TelegramUser } from '../../telegram';
import { updateLanguage } from './logic';
import {
  makeErrorUpdatingLanguageMessage,
  makeLanguageUpdatedMessage,
} from './message';

export * from './logic';
export * from './message';

export async function manageLanguage(
  text: string,
  telegramUser: TelegramUser,
): Promise<ServiceResponse> {
  const [, ...textSplit] = text.split(' ');
  const langText = textSplit.join(' ');

  const updateLanguageResponse = await updateLanguage({
    text: langText,
    telegramUser,
  });

  if (updateLanguageResponse.isOk) {
    return Result.Ok({
      message: makeLanguageUpdatedMessage(),
    });
  }

  return Result.Ok({
    message: makeErrorUpdatingLanguageMessage(),
  });
}

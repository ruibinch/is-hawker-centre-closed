import { Err, Ok, Result } from 'ts-results';

import { AWSError } from '../../errors/AWSError';
import { initDictionary, Language } from '../../lang';
import { getUserById, updateUserLanguageCode } from '../../models/User';
import { TelegramUser } from '../../utils/telegram';
import { GetUserLanguageCodeResponse } from './types';

export async function updateLanguage(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<Result<void, void>> {
  const {
    text,
    telegramUser: { id: userId },
  } = props;

  if (!isValidLanguageCode(text)) {
    return Err.EMPTY;
  }

  const languageCode = text;
  await updateUserLanguageCode(userId, languageCode);
  initDictionary(languageCode);

  return Ok.EMPTY;
}

function isValidLanguageCode(langCode: string): langCode is Language {
  return ['en', 'zh'].includes(langCode);
}

/**
 * Returns the `languageCode` value of the associated user.
 */
export async function getUserLanguageCode(
  telegramUser: TelegramUser,
): Promise<GetUserLanguageCodeResponse> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (getUserResponse.err) {
    // user does not exist in DB, return 'en' by default
    return { languageCode: 'en' };
  }

  const user = getUserResponse.val;
  return {
    languageCode: user.languageCode,
  };
}

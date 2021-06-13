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
): Promise<Result<GetUserLanguageCodeResponse, AWSError>> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (getUserResponse.err) {
    // user does not exist in DB
    return Err(getUserResponse.val);
  }

  const user = getUserResponse.val;
  return Ok({
    languageCode: user.languageCode,
  });
}

import { Err, Ok, Result } from 'ts-results';

import { initDictionary, Language } from '../../lang';
import {
  addUser,
  getUserById,
  updateUserLanguageCode,
  User,
} from '../../models/User';
import { TelegramUser } from '../../utils/telegram';
import { GetUserLanguageCodeResponse } from './types';

export async function updateLanguage(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<Result<void, void>> {
  const {
    text,
    telegramUser: { id: userId, username },
  } = props;

  if (!isValidLanguageCode(text)) {
    return Err.EMPTY;
  }

  const languageCode = text;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.err) {
    // user does not exist yet in DB
    const newUser = User.create({
      userId,
      username,
      languageCode,
      favourites: [],
      isInFavouritesMode: false,
      notifications: true,
    });

    await addUser(newUser);
  } else {
    await updateUserLanguageCode(userId, languageCode);
  }

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

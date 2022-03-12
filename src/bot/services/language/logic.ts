import { initDictionary, type Language } from '../../../lang';
import { Result, type ResultType } from '../../../lib/Result';
import {
  addUser,
  getUserById,
  updateUserLanguageCode,
  User,
} from '../../../models/User';
import type { TelegramUser } from '../../telegram';
import type { GetUserLanguageCodeResponse } from './types';

export async function updateLanguage(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<ResultType<void, void>> {
  const {
    text,
    telegramUser: { id: userId, username },
  } = props;

  if (!isValidLanguageCode(text)) {
    return Result.Err();
  }

  const languageCode = text;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.isErr) {
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
  return Result.Ok();
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

  if (getUserResponse.isErr) {
    // user does not exist in DB, return 'en' by default
    return { languageCode: 'en' };
  }

  const user = getUserResponse.value;
  return {
    languageCode: user.languageCode,
  };
}

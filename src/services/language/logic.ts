import { Err, Ok, Result } from 'ts-results';

import { initDictionary, Language } from '../../lang';
import { updateUserLanguageCode } from '../../models/User';
import { TelegramUser } from '../../utils/telegram';

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
  // TODO: pass in new languageCode
  initDictionary();

  return Ok.EMPTY;
}

function isValidLanguageCode(langCode: string): langCode is Language {
  return ['en', 'zh'].includes(langCode);
}

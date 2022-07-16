import { TelegramUpdateError } from '../errors/TelegramUpdateError';
import { TelegramMessage, TelegramUpdate } from './types';

export function makeTelegramApiBase(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

export function extractTelegramMessage(
  telegramUpdate: TelegramUpdate,
): TelegramMessage | null {
  // represents the bot being added to a group channel; ignore in such instances
  if (telegramUpdate.my_chat_member || telegramUpdate.chat_member) {
    return null;
  }

  if (telegramUpdate.message) {
    return telegramUpdate.message;
  }
  if (telegramUpdate.edited_message) {
    return telegramUpdate.edited_message;
  }
  if (telegramUpdate.callback_query?.message) {
    return telegramUpdate.callback_query.message;
  }

  throw new TelegramUpdateError(JSON.stringify(telegramUpdate));
}

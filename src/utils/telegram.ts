// Ref: https://core.telegram.org/bots/api
// NOTE: not a comprehensive type definition, the less-used fields are ignored

import { TelegramUpdateError } from '../errors/TelegramUpdateError';

export type TelegramResponseBase = {
  ok: boolean;
  description?: string;
};

// Entities

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

export type TelegramMessage = {
  message_id: number;
  from: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  sender_chat?: TelegramChat;
  via_bot?: TelegramUser;
  animation?: unknown;
  audio?: unknown;
  contact?: unknown;
  document?: unknown;
  location?: unknown;
  photo?: unknown;
  sticker?: unknown;
  video?: unknown;
  voice?: unknown;
};

export type WebhookInfoResponse = TelegramResponseBase & {
  result: {
    url: string;
  };
};

// Methods

export function makeTelegramApiBase(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

export function extractTelegramMessage(
  telegramUpdate: TelegramUpdate,
): TelegramMessage {
  if (telegramUpdate.message) {
    return telegramUpdate.message;
  }
  if (telegramUpdate.edited_message) {
    return telegramUpdate.edited_message;
  }

  throw new TelegramUpdateError();
}

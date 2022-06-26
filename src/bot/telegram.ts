// Ref: https://core.telegram.org/bots/api
// NOTE: not a comprehensive type definition, the less-used fields are ignored

import { TelegramUpdateError } from '../errors/TelegramUpdateError';

export const TELEGRAM_MESSAGE_MAX_LENGTH = 4096;

export type TelegramResponseBase = {
  ok: boolean;
  error_code?: number;
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
  my_chat_member?: unknown;
  chat_member?: unknown;
};

export type TelegramMessage = {
  message_id: number;
  from: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string | undefined;
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
  new_chat_members?: unknown;
  left_chat_member?: unknown;
};

export type TelegramSendMessageParamsFull = {
  chat_id: number | string;
  text: string;
  parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  entities?: unknown;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  protect_content?: boolean;
  reply_to_message_id?: boolean;
  allow_sending_without_reply?: boolean;
  // other reply_markup types excluded for brevity: https://core.telegram.org/bots/api#sendmessage
  reply_markup?: {
    // array of button rows
    inline_keyboard: Array<Array<TelegramInlineKeyboardButton>>;
  };
};

export type TelegramSendMessageParams = Omit<
  TelegramSendMessageParamsFull,
  'chat_id'
>;

export type TelegramInlineKeyboardButton = {
  text: string;
} & (
  | {
      url: string;
    }
  | {
      web_app: TelegramWebAppInfo;
    }
  | {
      callback_data: string;
    }
);

export type TelegramWebAppInfo = {
  url: string;
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

  throw new TelegramUpdateError(JSON.stringify(telegramUpdate));
}

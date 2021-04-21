// Ref: https://core.telegram.org/bots/api
// NOTE: not a comprehensive type definition, the less-used fields are ignored

type TelegramResponseBase = {
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
  language_code?: string;
};

type TelegramChat = {
  id: number;
  type: string;
  title: string;
  username: string;
  first_name: string;
  last_name: string;
};

export type TelegramMessage = {
  message_id: number;
  from: TelegramUser;
  date: number;
  chat: TelegramChat;
  text: string;
  sender_chat: TelegramChat;
  via_bot: TelegramUser;
};

// Methods

export type WebhookInfoResponse = TelegramResponseBase & {
  result: {
    url: string;
  };
};

export function makeTelegramApiBase(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

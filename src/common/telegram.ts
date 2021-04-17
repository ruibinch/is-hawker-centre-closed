// Ref: https://core.telegram.org/bots/api
// NOTE: not a comprehensive type definition, the less-used fields are ignored

type TelegramResponseBase = {
  ok: boolean;
  description?: string;
};

// Entities

type User = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type Chat = {
  id: number;
  type: string;
  title: string;
  username: string;
  first_name: string;
  last_name: string;
};

export type Message = {
  message_id: number;
  from: User;
  date: number;
  chat: Chat;
  text: string;
  sender_chat: Chat;
  via_bot: User;
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

import type {
  TelegramChat,
  TelegramMessage,
  TelegramUser,
} from '../../../src/bot/telegram';

export const mockTelegramUser: TelegramUser = {
  id: 1,
  is_bot: false,
  first_name: 'Ash',
  last_name: 'Ketchum',
  username: 'ashketchum',
};

export const mockTelegramChat: TelegramChat = {
  id: 1,
  type: 'private',
  first_name: 'Ash',
  last_name: 'Ketchum',
  username: 'ashketchum',
};

export function makeTelegramMessage(params: Partial<TelegramMessage> = {}): {
  message: TelegramMessage;
} {
  return {
    message: {
      message_id: 123,
      from: mockTelegramUser,
      date: 1609804800000,
      chat: mockTelegramChat,
      text: 'Default message',
      ...params,
    },
  };
}

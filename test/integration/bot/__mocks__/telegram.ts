import type {
  TelegramChat,
  TelegramMessage,
  TelegramUpdate,
  TelegramUser,
} from '../../../../src/bot/telegram';

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

export function makeTelegramCallbackQuery(
  callbackQueryParams: Partial<TelegramUpdate['callback_query']> = {},
): TelegramUpdate {
  return {
    update_id: 12345678,
    callback_query: {
      id: '9876543210',
      from: mockTelegramUser,
      message: {
        message_id: 123,
        from: {
          id: 99999,
          is_bot: true,
          first_name: 'HawkerCentreClosedBot',
          username: 'HawkerCentreClosedBot',
        },
        chat: mockTelegramChat,
        date: 1609804800000,
        text: 'Default message reply',
        entities: [],
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '1',
                callback_data: '$searchPagination 1',
              },
              {
                text: '2',
                callback_data: '$searchPagination 2',
              },
              {
                text: '3',
                callback_data: '$searchPagination 3',
              },
            ],
          ],
        },
      },
      chat_instance: '4838218291929123',
      data: '$searchPagination 2',
      ...callbackQueryParams,
    },
  };
}

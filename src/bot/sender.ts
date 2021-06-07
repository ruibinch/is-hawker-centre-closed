import axios from 'axios';

import { TelegramMessageError } from '../errors/TelegramMessageError';
import { makeTelegramApiBase, TelegramResponseBase } from '../utils/telegram';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export async function sendMessage(props: {
  chatId: number;
  message: string;
}): Promise<void> {
  const { chatId, message } = props;

  const response: TelegramResponseBase = await axios
    .get(`${makeTelegramApiBase(BOT_TOKEN)}/sendMessage`, {
      params: {
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
        reply_markup: {
          remove_keyboard: true,
        },
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error('[bot > sender > sendMessage]', error.response.data);
      return error.response.data;
    });

  if (!response.ok) {
    throw new TelegramMessageError();
  }
}

export async function sendMessageWithChoices(props: {
  chatId: number;
  message: string;
  choices: string[];
}): Promise<void> {
  const { chatId, message, choices } = props;

  const response: TelegramResponseBase = await axios
    .get(`${makeTelegramApiBase(BOT_TOKEN)}/sendMessage`, {
      params: {
        chat_id: chatId,
        text: message,
        reply_markup: {
          keyboard: choices.map((choice) => [{ text: choice }]),
          one_time_keyboard: true,
        },
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(
        '[bot > sender > sendMessageWithChoices]',
        error.response.data,
      );
      return error.response.data;
    });

  if (!response.ok) {
    throw new TelegramMessageError();
  }
}

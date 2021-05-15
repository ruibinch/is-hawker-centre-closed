import axios from 'axios';

import { makeTelegramApiBase } from '../utils/telegram';
import { BOT_TOKEN } from './variables';

export function sendMessage(props: { chatId: number; message: string }): void {
  const { chatId, message } = props;

  axios.get(`${makeTelegramApiBase(BOT_TOKEN)}/sendMessage`, {
    params: {
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        remove_keyboard: true,
      },
    },
  });
}

export function sendMessageWithChoices(props: {
  chatId: number;
  message: string;
  choices: string[];
}): void {
  const { chatId, message, choices } = props;

  axios.get(`${makeTelegramApiBase(BOT_TOKEN)}/sendMessage`, {
    params: {
      chat_id: chatId,
      text: message,
      reply_markup: {
        keyboard: choices.map((choice) => [{ text: choice }]),
        one_time_keyboard: true,
      },
    },
  });
}

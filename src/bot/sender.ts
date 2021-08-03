import axios from 'axios';

import { TelegramMessageError } from '../errors/TelegramMessageError';
import {
  makeTelegramApiBase,
  TelegramResponseBase,
  TELEGRAM_MESSAGE_MAX_LENGTH,
} from '../utils/telegram';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export async function sendMessage(props: {
  chatId: number;
  message: string;
}): Promise<void> {
  const { chatId, message } = props;

  const telegramSendMessageUrl = `${makeTelegramApiBase(
    BOT_TOKEN,
  )}/sendMessage`;

  const makeSendMessageParams = (text: string) => ({
    params: {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        remove_keyboard: true,
      },
    },
  });

  const telegramMessages =
    message.length > TELEGRAM_MESSAGE_MAX_LENGTH
      ? (() => {
          const messageSplit = message.split('\n\n');

          let firstMessageLength = 0;
          let splitIndex = 0;
          for (let i = 0; i < messageSplit.length; i += 1) {
            // 2 represents the length of \n\n delimiter
            const entryLength = messageSplit[i].length + 2;

            if (
              firstMessageLength + entryLength >
              TELEGRAM_MESSAGE_MAX_LENGTH
            ) {
              break;
            }

            firstMessageLength += entryLength;
            splitIndex = i;
          }

          // Assumption: message.length will never exceed 4096 * 2
          const firstMessage = messageSplit
            .slice(0, splitIndex + 1)
            .join('\n\n');
          const secondMessage = messageSplit.slice(splitIndex + 1).join('\n\n');

          return [firstMessage, secondMessage];
        })()
      : [message];

  const responses: TelegramResponseBase[] = await Promise.all(
    telegramMessages.map((telegramMessage) =>
      axios.get(telegramSendMessageUrl, makeSendMessageParams(telegramMessage)),
    ),
  )
    .then((_responses) => _responses.map((res) => res.data))
    .catch((error) => {
      console.error('[bot > sender > sendMessage]', {
        telegramResponse: error.response.data,
        message,
      });
      return error.response.data;
    });

  if (responses.some((res) => !res.ok)) {
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

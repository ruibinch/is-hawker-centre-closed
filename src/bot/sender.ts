import axios from 'axios';

import { TelegramMessageError } from '../errors/TelegramMessageError';
import {
  makeTelegramApiBase,
  TelegramResponseBase,
  TelegramSendMessageParams,
  TELEGRAM_MESSAGE_MAX_LENGTH,
} from './telegram';

const { TELEGRAM_BOT_TOKEN } = process.env;

export async function sendMessage(props: {
  chatId: number;
  message?: string | undefined;
  messageParams?: TelegramSendMessageParams | undefined;
}): Promise<void> {
  const { chatId, message: _message, messageParams } = props;
  const message = _message ?? messageParams?.text;
  if (!message) return;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error(
      '[bot > sender > sendMessage] TELEGRAM_BOT_TOKEN not defined',
    );
  }

  const telegramSendMessageUrl = `${makeTelegramApiBase(
    TELEGRAM_BOT_TOKEN,
  )}/sendMessage`;

  const makeSendMessageParams = (text: string) => ({
    params: {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      reply_markup: messageParams?.reply_markup ?? {
        remove_keyboard: true,
      },
    },
  });

  const telegramMessages =
    message.length > TELEGRAM_MESSAGE_MAX_LENGTH
      ? (() => {
          const delimiter = '\n\n';
          const messageSplit = message.split(delimiter);

          let firstMessageLength = 0;
          let splitIndex = 0;
          for (let i = 0; i < messageSplit.length; i += 1) {
            const entryLength = messageSplit[i].length + delimiter.length;

            if (
              firstMessageLength + entryLength >
              TELEGRAM_MESSAGE_MAX_LENGTH
            ) {
              break;
            }

            firstMessageLength += entryLength;
            splitIndex = i;
          }

          // Assumption: message.length will never exceed 4096 * 2, i.e. at most 2 Telegram messages are required
          const firstMessage = messageSplit
            .slice(0, splitIndex + 1)
            .join('\n\n');
          const secondMessage = messageSplit.slice(splitIndex + 1).join('\n\n');

          return [firstMessage, secondMessage];
        })()
      : [message];

  // Execute promises sequentially
  const responses = await telegramMessages.reduce(
    (promise, telegramMessage) =>
      promise.then((_responses) =>
        axios
          .get(telegramSendMessageUrl, makeSendMessageParams(telegramMessage))
          .then((res) => res.data)
          .catch((error) => {
            console.error('[bot > sender > sendMessage]', {
              telegramResponse: error.response.data,
              message,
            });
            return error.response.data;
          })
          .then((_response: TelegramResponseBase) => [
            ..._responses,
            _response,
          ]),
      ),
    Promise.resolve([] as TelegramResponseBase[]),
  );

  const errorResponses = responses.filter((res) => !res.ok);
  if (errorResponses.length > 0) {
    // just throw the first response for convenience
    throw new TelegramMessageError(errorResponses[0]);
  }
}

export async function sendMessageWithChoices(props: {
  chatId: number;
  message?: string | undefined;
  messageParams?: TelegramSendMessageParams | undefined;
  choices: string[];
}): Promise<void> {
  const { chatId, message: _message, messageParams, choices } = props;
  const message = _message ?? messageParams?.text;
  if (!message) return;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error(
      '[bot > sender > sendMessageWithChoices] TELEGRAM_BOT_TOKEN not defined',
    );
  }

  const response: TelegramResponseBase = await axios
    .get(`${makeTelegramApiBase(TELEGRAM_BOT_TOKEN)}/sendMessage`, {
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
    throw new TelegramMessageError(response);
  }
}

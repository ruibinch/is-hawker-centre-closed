import axios from 'axios';

import { TelegramMessageError } from '../errors/TelegramMessageError';
import { MESSAGE_NOT_MODIFIED_ERROR } from './constants';
import { makeTelegramApiBase } from './helpers';
import {
  TelegramAnswerCallbackQueryParams,
  TelegramEditMessageTextParams,
  TelegramResponseBase,
  TelegramSendMessageParams,
} from './types';

const { TELEGRAM_BOT_TOKEN } = process.env;

const TELEGRAM_MESSAGE_MAX_LENGTH = 4096;

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
      '[telegram > methods > sendMessage] TELEGRAM_BOT_TOKEN not defined',
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
            console.error('[telegram > methods > sendMessage]', {
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

  if (message.length > TELEGRAM_MESSAGE_MAX_LENGTH) {
    // After implementation of search pagination, there should no longer be excessively long messages
    // TODO: consider removing IIFE above for handling too-long messages in the future
    throw new Error(
      `Message should not exceed max allowed length of ${TELEGRAM_MESSAGE_MAX_LENGTH}`,
    );
  }

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
      '[telegram > methods > sendMessageWithChoices] TELEGRAM_BOT_TOKEN not defined',
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
        '[telegram > methods > sendMessageWithChoices]',
        error.response.data,
      );
      return error.response.data;
    });

  if (!response.ok) {
    throw new TelegramMessageError(response);
  }
}

export async function editMessageText(props: {
  chatId: number;
  message?: string | undefined;
  messageParams?: TelegramSendMessageParams | undefined;
  editMessageId: number;
}): Promise<void> {
  const { chatId, message: _message, messageParams, editMessageId } = props;
  const message = _message ?? messageParams?.text;
  if (!message) return;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error(
      '[telegram > methods > editMessageText] TELEGRAM_BOT_TOKEN not defined',
    );
  }

  const editMessageTextParams: TelegramEditMessageTextParams = {
    chat_id: chatId,
    message_id: editMessageId,
    text: message,
    parse_mode: 'MarkdownV2',
    reply_markup: messageParams?.reply_markup,
  };

  const response: TelegramResponseBase = await axios
    .get(`${makeTelegramApiBase(TELEGRAM_BOT_TOKEN)}/editMessageText`, {
      params: editMessageTextParams,
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(
        '[telegram > methods > editMessageText]',
        error.response.data,
      );
      return error.response.data;
    });

  if (
    !response.ok &&
    !response.description?.includes(MESSAGE_NOT_MODIFIED_ERROR)
  ) {
    throw new TelegramMessageError(response);
  }
}

export async function answerCallbackQuery(props: {
  queryId: string;
  text?: string | void;
}) {
  const { queryId, text } = props;

  const answerCallbackQueryParams: TelegramAnswerCallbackQueryParams = {
    callback_query_id: queryId,
    text: text ?? undefined,
  };

  const response: TelegramResponseBase = await axios
    .get(`${makeTelegramApiBase(TELEGRAM_BOT_TOKEN)}/answerCallbackQuery`, {
      params: answerCallbackQueryParams,
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(
        '[telegram > methods > answerCallbackQuery]',
        error.response.data,
      );
      return error.response.data;
    });

  if (!response.ok) {
    // Ignore error if old/new message content is the same
    // This is usually prevented with "$searchPagination null" but it can slip through when tapping rapidly on the
    // current page button after switching to it
    if (
      response.description?.startsWith('Bad request: message is not modified')
    ) {
      return;
    }

    throw new TelegramMessageError(response);
  }
}

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

import { makeCallbackWrapper } from '../common/lambda';
import { makeTelegramApiBase, TelegramMessage } from '../common/telegram';
import { isFavouritesCommand, manageFavourites } from '../features/favourites';
import { runSearch } from '../features/search';
import { validateToken } from './auth';
import { isInfoCommand, makeCommandMessage } from './commands';
import { sanitiseInputText } from './utils';
import { BOT_TOKEN } from './variables';

export const bot: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);
  if (!validateToken(event.queryStringParameters)) {
    return callbackWrapper(403);
  }

  if (!event.body) {
    return callbackWrapper(400);
  }

  const reqBody = JSON.parse(event.body);
  const inputMessage = reqBody.message as TelegramMessage;
  const {
    from: telegramUser,
    chat: { id: chatId },
    text,
  } = inputMessage;

  const textSanitised = sanitiseInputText(text);

  if (!textSanitised || textSanitised.trim().length === 0) {
    sendMessage(chatId, 'Specify some keywords\\!');
    return callbackWrapper(204);
  }

  if (isInfoCommand(textSanitised)) {
    const commandMessage = makeCommandMessage(textSanitised);
    sendMessage(chatId, commandMessage);
    return callbackWrapper(204);
  }

  // TODO: remove repetitions in this section

  if (isFavouritesCommand(textSanitised)) {
    return manageFavourites(textSanitised, telegramUser).then((botResponse) => {
      if (botResponse === null) {
        return callbackWrapper(400);
      }

      const { message, choices } = botResponse;

      if (choices) {
        sendMessageWithChoices(chatId, message, choices);
      } else {
        sendMessage(chatId, message);
      }
      return callbackWrapper(204);
    });
  }

  await runSearch(textSanitised).then((botResponse) => {
    if (botResponse === null) {
      return callbackWrapper(400);
    }

    const { message } = botResponse;

    sendMessage(chatId, message);
    return callbackWrapper(204);
  });

  return callbackWrapper(502);
};

function sendMessage(chatId: number, message: string) {
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

function sendMessageWithChoices(
  chatId: number,
  message: string,
  choices: string[],
) {
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

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

import { makeCallbackWrapper } from '../common/lambda';
import { makeGenericErrorMessage } from '../common/message';
import { makeTelegramApiBase, TelegramMessage } from '../common/telegram';
import { isFavouritesCommand, manageFavourites } from '../features/favourites';
import { addFeedback, isFeedbackCommand } from '../features/feedback';
import { runSearch } from '../features/search';
import { validateToken } from './auth';
import { isCommand, makeCommandMessage } from './commands';
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

  if (!textSanitised || textSanitised.length === 0) {
    sendMessage(chatId, 'Specify some keywords\\!');
    return callbackWrapper(204);
  }

  if (isCommand(textSanitised)) {
    const commandMessage = makeCommandMessage(textSanitised);
    if (commandMessage) {
      sendMessage(chatId, commandMessage);
      return callbackWrapper(204);
    }
  }

  // TODO: remove repetitions in this section
  try {
    if (isFavouritesCommand(textSanitised)) {
      const botResponse = await manageFavourites(textSanitised, telegramUser);
      if (botResponse === null) throw new Error();

      const { message, choices } = botResponse;

      if (choices) {
        sendMessageWithChoices(chatId, message, choices);
      } else {
        sendMessage(chatId, message);
      }
      return callbackWrapper(204);
    }

    if (isFeedbackCommand(textSanitised)) {
      const botResponse = await addFeedback(textSanitised, telegramUser);
      if (botResponse === null) throw new Error();

      const { message } = botResponse;

      sendMessage(chatId, message);
      return callbackWrapper(204);
    }

    const botResponse = await runSearch(textSanitised);
    if (botResponse === null) throw new Error();

    const { message } = botResponse;

    sendMessage(chatId, message);
    return callbackWrapper(204);
  } catch (error) {
    console.log(error);
    sendMessage(chatId, makeGenericErrorMessage());
    return callbackWrapper(400);
  }
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

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../common/lambda';
import { makeGenericErrorMessage } from '../common/message';
import { TelegramMessage } from '../common/telegram';
import { Module } from '../common/types';
import { manageFavourites } from '../features/favourites';
import { manageFeedback } from '../features/feedback';
import { runSearch } from '../features/search';
import { validateToken } from './auth';
import { isCommand, isCommandInModule, makeCommandMessage } from './commands';
import { sendMessage, sendMessageWithChoices } from './sender';
import { sanitiseInputText } from './utils';

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
    sendMessage({ chatId, message: 'Specify some keywords\\!' });
    return callbackWrapper(204);
  }

  if (isCommand(textSanitised)) {
    const commandMessage = makeCommandMessage(textSanitised);
    if (commandMessage) {
      sendMessage({ chatId, message: commandMessage });
      return callbackWrapper(204);
    }
  }

  try {
    const executionFn = makeExecutionFn(textSanitised);

    const botResponse = await executionFn(textSanitised, telegramUser);
    if (botResponse === null) throw new Error();

    const { message, choices } = botResponse;

    if (choices) {
      sendMessageWithChoices({ chatId, message, choices });
    } else {
      sendMessage({ chatId, message });
    }
    return callbackWrapper(204);
  } catch (error) {
    console.log(error);
    sendMessage({ chatId, message: makeGenericErrorMessage() });
    return callbackWrapper(400);
  }
};

const makeExecutionFn = (textSanitised: string) => {
  if (isCommandInModule(textSanitised, Module.favourites)) {
    return manageFavourites;
  }
  if (isCommandInModule(textSanitised, Module.feedback)) {
    return manageFeedback;
  }

  return runSearch;
};

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../aws/lambda';
import { AWSError } from '../errors/AWSError';
import { initDictionary } from '../lang';
import {
  maybeHandleFavouriteSelection,
  manageFavourites,
} from '../services/favourites';
import { manageFeedback } from '../services/feedback';
import { constructNotifications } from '../services/notifications';
import { runSearch } from '../services/search';
import { makeGenericErrorMessage } from '../utils/message';
import { TelegramMessage } from '../utils/telegram';
import { BotResponse } from '../utils/types';
import { validateToken } from './auth';
import { isCommand, isCommandInModule, makeCommandMessage } from './commands';
import { sendMessage, sendMessageWithChoices } from './sender';
import { validateInputMessage } from './utils';

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

  initDictionary();

  const reqBody = JSON.parse(event.body);
  const inputMessage = reqBody.message as TelegramMessage;
  const {
    from: telegramUser,
    chat: { id: chatId },
  } = inputMessage;

  const validationResponse = validateInputMessage(inputMessage);

  if (!validationResponse.success) {
    const { errorMessage } = validationResponse;
    sendMessage({ chatId, message: errorMessage });
    return callbackWrapper(204);
  }

  const { textSanitised } = validationResponse;

  if (isCommand(textSanitised)) {
    const commandMessage = makeCommandMessage(textSanitised);
    if (commandMessage) {
      sendMessage({ chatId, message: commandMessage });
      return callbackWrapper(204);
    }
  }

  const makeExecutionFn = (_textSanitised: string) => {
    if (isCommandInModule(_textSanitised, 'favourites')) {
      return manageFavourites;
    }
    if (isCommandInModule(_textSanitised, 'feedback')) {
      return manageFeedback;
    }

    return runSearch;
  };

  // this try-catch loop will catch all the errors that have bubbled up from the child functions
  try {
    let botResponse: BotResponse | undefined;

    // eslint-disable-next-line max-len
    // must always first check if the user is in favourites mode so that isInFavouritesMode can be toggled back to false if applicable
    const maybeHandleFavouriteSelectionResult = await maybeHandleFavouriteSelection(
      textSanitised,
      telegramUser,
    );

    if (maybeHandleFavouriteSelectionResult.ok) {
      botResponse = maybeHandleFavouriteSelectionResult.val;
    } else {
      // If favourites flow is not applicable, perform customary handling
      const executionFn = makeExecutionFn(textSanitised);
      const executionFnResponse = await executionFn(
        textSanitised,
        telegramUser,
      );

      if (executionFnResponse.ok) {
        botResponse = executionFnResponse.val;
      } else if (executionFnResponse.val instanceof AWSError) {
        throw executionFnResponse.val;
      }
    }

    // TODO: throw custom error
    if (!botResponse) throw new Error();
    const { message, choices } = botResponse;

    // TODO: throw custom error
    if (choices) {
      sendMessageWithChoices({ chatId, message, choices });
    } else {
      sendMessage({ chatId, message });
    }

    return callbackWrapper(204);
  } catch (error) {
    // console.log(error);
    sendMessage({ chatId, message: makeGenericErrorMessage() });
    return callbackWrapper(400);
  }
};

export const notifications: APIGatewayProxyHandler = async (
  _event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  initDictionary();

  const notificationsOutput = await constructNotifications();
  if (notificationsOutput.err) {
    return callbackWrapper(400);
  }

  notificationsOutput.val.forEach((notification) => {
    const { userId: chatId, message } = notification;
    sendMessage({ chatId, message });
  });

  return callbackWrapper(204);
};

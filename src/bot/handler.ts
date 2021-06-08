import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { makeCallbackWrapper } from '../aws/lambda';
import { AWSError } from '../errors/AWSError';
import { ServiceError } from '../errors/ServiceError';
import { initDictionary } from '../lang';
import {
  maybeHandleFavouriteSelection,
  manageFavourites,
} from '../services/favourites';
import { manageFeedback } from '../services/feedback';
import { makeGenericErrorMessage } from '../services/message';
import { constructNotifications } from '../services/notifications';
import { runSearch } from '../services/search';
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

  // this try-catch loop will catch all the errors that have bubbled up from the child functions
  try {
    const validationResponse = validateInputMessage(inputMessage);

    if (validationResponse.err) {
      const { errorMessage } = validationResponse.val;
      await sendMessage({ chatId, message: errorMessage });
      return callbackWrapper(204);
    }

    const { textSanitised } = validationResponse.val;

    if (isCommand(textSanitised)) {
      const commandMessage = makeCommandMessage(textSanitised);
      if (commandMessage) {
        await sendMessage({ chatId, message: commandMessage });
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

    let botResponse: BotResponse | undefined;

    // eslint-disable-next-line max-len
    // must always first check if the user is in favourites mode so that isInFavouritesMode can be toggled back to false if applicable
    const maybeHandleFavouriteSelectionResult =
      await maybeHandleFavouriteSelection(textSanitised, telegramUser);

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

    if (!botResponse) throw new ServiceError();
    const { message, choices } = botResponse;

    if (choices) {
      await sendMessageWithChoices({ chatId, message, choices });
    } else {
      await sendMessage({ chatId, message });
    }

    return callbackWrapper(204);
  } catch (error) {
    // TODO: improve error handling based on error type (Sentry?)
    console.error('[bot > handler]', error);
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

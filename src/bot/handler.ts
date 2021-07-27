import * as Sentry from '@sentry/serverless';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { AWSError } from '../errors/AWSError';
import { ServiceError } from '../errors/ServiceError';
import { makeCallbackWrapper } from '../ext/aws/lambda';
import { initDictionary } from '../lang';
import {
  maybeHandleFavouriteSelection,
  manageFavourites,
} from '../services/favourites';
import { manageFeedback } from '../services/feedback';
import { saveInput } from '../services/input';
import { getUserLanguageCode, manageLanguage } from '../services/language';
import { makeGenericErrorMessage } from '../services/message';
import { runSearch } from '../services/search';
import { extractTelegramMessage, TelegramUpdate } from '../utils/telegram';
import { BotResponse } from '../utils/types';
import { validateToken } from './auth';
import { isCommand, isCommandInModule, makeCommandMessage } from './commands';
import { sendMessage, sendMessageWithChoices } from './sender';
import { expandAcronymsInText, validateInputMessage } from './utils';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const bot = Sentry.AWSLambda.wrapHandler(
  async (
    event: APIGatewayProxyEvent,
    _context,
    callback,
  ): Promise<APIGatewayProxyResult> => {
    const callbackWrapper = makeCallbackWrapper(callback);
    let chatId: number | undefined;

    // this try-catch loop will catch all the errors that have bubbled up from the child functions
    try {
      if (!validateToken(event.queryStringParameters)) {
        return callbackWrapper(403);
      }

      if (!event.body) {
        return callbackWrapper(400);
      }

      const telegramUpdate = JSON.parse(event.body) as TelegramUpdate;
      const telegramMessage = extractTelegramMessage(telegramUpdate);
      if (telegramMessage === null) {
        return callbackWrapper(204);
      }

      const { from: telegramUser } = telegramMessage;
      chatId = telegramMessage.chat.id;

      const { languageCode } = await getUserLanguageCode(telegramUser);
      initDictionary(languageCode);

      const validationResponse = validateInputMessage(telegramMessage);
      if (validationResponse.err) {
        const { errorMessage } = validationResponse.val;
        await sendMessage({ chatId, message: errorMessage });
        return callbackWrapper(200);
      }

      const { textSanitised } = validationResponse.val;
      if (textSanitised === null) {
        return callbackWrapper(204);
      }

      // tmp: save all incoming inputs for now for better usage understanding
      await saveInput(textSanitised, telegramUser);

      if (isCommand(textSanitised)) {
        const commandMessage = makeCommandMessage(textSanitised);
        if (commandMessage) {
          await sendMessage({ chatId, message: commandMessage });
          return callbackWrapper(200);
        }
      }

      const textExpanded = expandAcronymsInText(textSanitised);

      // eslint-disable-next-line max-len
      // must always first check if the user is in favourites mode so that isInFavouritesMode can be toggled back to false if applicable
      const maybeHandleFavouriteSelectionResult =
        await maybeHandleFavouriteSelection(textExpanded, telegramUser);

      let botResponse: BotResponse | undefined;

      if (maybeHandleFavouriteSelectionResult.ok) {
        botResponse = maybeHandleFavouriteSelectionResult.val;
      } else {
        // If favourites flow is not applicable, perform customary handling
        const executionFn = getExecutionFn(textExpanded);
        const executionFnResponse = await executionFn(
          textExpanded,
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

      return callbackWrapper(200);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[bot > handler]', error);
        Sentry.captureException(error);
      }

      if (chatId !== undefined) {
        await sendMessage({ chatId, message: makeGenericErrorMessage() });
        return callbackWrapper(200);
      }

      return callbackWrapper(204);
    }
  },
);

const getExecutionFn = (_textSanitised: string) => {
  if (isCommandInModule(_textSanitised, 'favourites')) {
    return manageFavourites;
  }
  if (isCommandInModule(_textSanitised, 'language')) {
    return manageLanguage;
  }
  if (isCommandInModule(_textSanitised, 'feedback')) {
    return manageFeedback;
  }

  return runSearch;
};

import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { ServiceError } from '../../errors/ServiceError';
import { makeLambdaResponse } from '../../ext/aws/lambda';
import {
  answerCallbackQuery,
  editMessageText,
  extractTelegramMessage,
  sendMessage,
  sendMessageWithChoices,
  TelegramUpdate,
} from '../../telegram';
import { getStage } from '../../utils/stage';
import { validateToken } from '../auth';
import { isCommand, isCommandInModule, makeCommandMessage } from '../commands';
import { validateInputMessage } from '../inputHelpers';
import { initDictionary } from '../lang';
import { handleCallbackQuery } from '../services/callback';
import {
  manageFavourites,
  maybeHandleFavouriteSelection,
} from '../services/favourites';
import { manageFeedback } from '../services/feedback';
import { manageGeneral } from '../services/general';
import { saveInput } from '../services/input';
import { getUserLanguageCode, manageLanguage } from '../services/language';
import { makeGenericErrorMessage } from '../services/message';
import { runSearch } from '../services/search';
import type { BotResponse } from '../types';

dotenv.config();

Sentry.AWSLambda.init({
  // TODO: consider a config/env folder instead of solely relying on .env file
  dsn: process.env.NODE_ENV === 'test' ? '' : process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
  environment: getStage(),
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let chatId: number | undefined;

    // this try-catch loop will catch all the errors that have bubbled up from the child functions
    try {
      if (!validateToken(event.queryStringParameters)) {
        return makeLambdaResponse(403);
      }
      if (!event.body) {
        return makeLambdaResponse(400);
      }

      const telegramUpdate = JSON.parse(event.body) as TelegramUpdate;

      const telegramMessage = extractTelegramMessage(telegramUpdate);
      if (telegramMessage === null) {
        return makeLambdaResponse(204);
      }

      /* initialisation */

      const { from: telegramUser, chat: telegramChat } = telegramMessage;
      chatId = telegramMessage.chat.id;
      const { languageCode } = await getUserLanguageCode(chatId);
      initDictionary(languageCode);

      /* validation */

      const validationResponse = validateInputMessage(telegramMessage);
      if (validationResponse.isErr) {
        const { errorMessage } = validationResponse.value;
        await sendMessage({ chatId, message: errorMessage });
        return makeLambdaResponse(200);
      }
      const { textSanitised } = validationResponse.value;
      if (textSanitised === null) {
        return makeLambdaResponse(204);
      }

      /* handling implementation */

      // handle inline keyboard callback queries

      if (telegramUpdate.callback_query) {
        const { callback_query: callbackQuery } = telegramUpdate;
        if (callbackQuery.data) {
          await saveInput(
            `${telegramMessage.date}::${callbackQuery.data}`,
            telegramChat,
          );
        }

        const callbackHandlerResult = await handleCallbackQuery({
          userId: chatId,
          callbackQuery,
        });
        if (callbackHandlerResult.isErr) {
          await answerCallbackQuery({
            queryId: callbackQuery.id,
            text: callbackHandlerResult.value,
          });
        } else {
          await editMessageText({
            ...callbackHandlerResult.value,
            chatId,
          });
          await answerCallbackQuery({ queryId: callbackQuery.id });
        }

        return makeLambdaResponse(200);
      }

      // handle standard user inputs

      await saveInput(textSanitised, telegramChat);

      if (isCommand(textSanitised)) {
        const commandMessageResult = makeCommandMessage(textSanitised);
        if (commandMessageResult.isOk) {
          await sendMessage({
            chatId,
            messageParams: commandMessageResult.value,
          });
          return makeLambdaResponse(200);
        }
      }

      // eslint-disable-next-line max-len
      // must always first check if the user is in favourites mode so that isInFavouritesMode can be toggled back to false if applicable
      const maybeHandleFavouriteSelectionResult =
        await maybeHandleFavouriteSelection(textSanitised, telegramUser);

      let botResponse: BotResponse | undefined;

      if (maybeHandleFavouriteSelectionResult.isOk) {
        botResponse = maybeHandleFavouriteSelectionResult.value;
      } else {
        // If favourites flow is not applicable, perform customary handling
        const executionFn = getExecutionFn(textSanitised);
        const executionFnResponse = await executionFn(
          textSanitised,
          telegramUser,
        );

        if (executionFnResponse.isOk) {
          botResponse = executionFnResponse.value;
        }
      }

      if (!botResponse) throw new ServiceError();
      const { message, messageParams, choices } = botResponse;

      if (choices) {
        await sendMessageWithChoices({
          chatId,
          message,
          messageParams,
          choices,
        });
      } else {
        await sendMessage({ chatId, message, messageParams });
      }

      return makeLambdaResponse(200);
    } catch (error) {
      /* istanbul ignore next */
      if (process.env.NODE_ENV !== 'test') {
        console.error('[bot > handler]', error);
        Sentry.captureException(error);
      }

      if (chatId !== undefined) {
        await sendMessage({
          chatId,
          message: makeGenericErrorMessage(),
        });
        return makeLambdaResponse(200);
      }

      /* istanbul ignore next */
      return makeLambdaResponse(204);
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
  if (isCommandInModule(_textSanitised, 'general')) {
    return manageGeneral;
  }
  return runSearch;
};

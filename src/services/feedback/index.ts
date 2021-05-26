import { TelegramUser } from '../../utils/telegram';
import { ServiceResponse } from '../../utils/types';
import { addFeedback } from './logic';
import {
  makeErrorAddingFeedbackMessage,
  makeFeedbackAddedMessage,
} from './message';

export * from './logic';
export * from './message';

export async function manageFeedback(
  text: string,
  telegramUser: TelegramUser,
): ServiceResponse {
  const [, ...textSplit] = text.split(' ');
  const feedbackText = textSplit.join(' ');

  const addFeedbackResponse = await addFeedback({
    text: feedbackText,
    telegramUser,
  });

  const { success } = addFeedbackResponse;

  if (success) {
    return {
      message: makeFeedbackAddedMessage(),
    };
  }

  return {
    message: makeErrorAddingFeedbackMessage(),
  };
}

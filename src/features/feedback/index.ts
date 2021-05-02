import { TelegramUser } from '../../common/telegram';
import { BotResponse } from '../../common/types';
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
): Promise<BotResponse | null> {
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

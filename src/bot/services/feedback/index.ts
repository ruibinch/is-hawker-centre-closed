import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../../utils';
import type { TelegramUser } from '../../telegram';
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
): Promise<ServiceResponse> {
  const [, ...textSplit] = text.split(' ');
  const feedbackText = textSplit.join(' ');

  const addFeedbackResponse = await addFeedback({
    text: feedbackText,
    telegramUser,
  });

  if (addFeedbackResponse.isOk) {
    return Result.Ok({
      message: makeFeedbackAddedMessage(),
    });
  }

  return Result.Ok({
    message: makeErrorAddingFeedbackMessage(),
  });
}

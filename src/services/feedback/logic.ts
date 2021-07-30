import { Ok, Result } from 'ts-results';

import { CustomError } from '../../errors/CustomError';
import { addFeedbackToDB, Feedback } from '../../models/Feedback';
import { currentDate } from '../../utils/date';
import { TelegramUser } from '../../utils/telegram';

export async function addFeedback(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<Result<void, CustomError>> {
  const {
    text,
    telegramUser: { id: userId, username },
  } = props;

  const feedback = Feedback.create({
    feedbackId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text,
  });

  const addFeedbackResponse = await addFeedbackToDB(feedback);
  if (addFeedbackResponse.err) return addFeedbackResponse;

  return Ok.EMPTY;
}

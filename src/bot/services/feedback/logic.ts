import { Result, type ResultType } from '../../../lib/Result';
import { addFeedbackToDB, Feedback } from '../../../models/Feedback';
import type { TelegramUser } from '../../../telegram';
import { currentDate } from '../../../utils/date';

export async function addFeedback(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<ResultType<void, Error>> {
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
  if (addFeedbackResponse.isErr) return addFeedbackResponse;

  return Result.Ok();
}

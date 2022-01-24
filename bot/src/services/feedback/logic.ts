import { Result, type ResultType } from '../../../../common/lib/Result';
import { addFeedbackToDB, Feedback } from '../../models/Feedback';
import { currentDate } from '../../utils/date';
import type { TelegramUser } from '../../utils/telegram';

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

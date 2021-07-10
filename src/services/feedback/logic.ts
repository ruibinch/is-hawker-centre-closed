import { Ok, Result } from 'ts-results';

import { addFeedbackToDB, Feedback } from '../../models/Feedback';
import { currentDate } from '../../utils/date';
import { TelegramUser } from '../../utils/telegram';

export async function addFeedback(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<Result<void, void>> {
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

  await addFeedbackToDB(feedback);
  return Ok.EMPTY;
}

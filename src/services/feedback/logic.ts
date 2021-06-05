import { Ok, Result } from 'ts-results';

import { addFeedbackToDB } from '../../models/Feedback';
import { Feedback } from '../../models/types';
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

  const feedback: Feedback = {
    feedbackId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text,
  };

  await addFeedbackToDB(feedback);
  return Ok.EMPTY;
}

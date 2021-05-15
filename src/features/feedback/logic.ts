import { formatISO } from 'date-fns';

import { addFeedbackToDB } from '../../models/Feedback';
import { Feedback } from '../../models/types';
import { currentDate } from '../../utils/date';
import { TelegramUser } from '../../utils/telegram';
import { AddFeedbackResponse } from './types';

export async function addFeedback(props: {
  text: string;
  telegramUser: TelegramUser;
}): Promise<AddFeedbackResponse> {
  const {
    text,
    telegramUser: { id: userId, username },
  } = props;

  const feedback: Feedback = {
    feedbackId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text,
    dateSubmitted: formatISO(currentDate()),
  };

  await addFeedbackToDB(feedback);
  return { success: true };
}

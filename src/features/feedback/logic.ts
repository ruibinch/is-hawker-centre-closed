import { formatISO } from 'date-fns';

import { currentDate } from '../../common/date';
import { TelegramUser } from '../../common/telegram';
import { addFeedbackToDB } from '../../models/Feedback';
import { Feedback } from '../../models/types';
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

  addFeedbackToDB(feedback);

  return { success: true };
}

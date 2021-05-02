import { formatISO } from 'date-fns';

import { COMMANDS } from '../../bot/commands';
import { currentDate } from '../../common/date';
import { TelegramUser } from '../../common/telegram';
import { Module } from '../../common/types';
import { addFeedbackToDB } from '../../models/Feedback';
import { Feedback } from '../../models/types';
import { AddFeedbackResponse } from './types';

// TODO: refactor to isInModule curried function
export function isFeedbackCommand(s: string): boolean {
  const [command] = s.split(' ');

  return COMMANDS.filter((cmd) => cmd.module === Module.feedback)
    .map((cmd) => cmd.endpoint)
    .includes(command);
}

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

import { formatISO } from 'date-fns';

import { COMMANDS } from '../../bot/commands';
import { currentDate } from '../../common/date';
import { TelegramUser } from '../../common/telegram';
import { BotResponse, Module } from '../../common/types';
import { addFeedbackToDB } from '../../models/Feedback';
import { Feedback } from '../../models/types';
import { makeFeedbackAddedMessage } from './message';

// TODO: refactor to isInModule curried function
export function isFeedbackCommand(s: string): boolean {
  const [command] = s.split(' ');

  return COMMANDS.filter((cmd) => cmd.module === Module.feedback)
    .map((cmd) => cmd.endpoint)
    .includes(command);
}

export async function addFeedback(
  text: string,
  telegramUser: TelegramUser,
): Promise<BotResponse | null> {
  const { id: userId, username } = telegramUser;

  const [, ...textSplit] = text.split(' ');
  const feedbackText = textSplit.join(' ');

  const feedback: Feedback = {
    feedbackId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text: feedbackText,
    dateSubmitted: formatISO(currentDate()),
  };

  addFeedbackToDB(feedback);

  return {
    message: makeFeedbackAddedMessage(),
  };
}

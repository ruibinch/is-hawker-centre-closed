import { addInputToDB, Input } from '../../../models/Input';
import { currentDate } from '../../../utils/date';
import type { TelegramChat } from '../../telegram';

export async function saveInput(
  text: string,
  telegramChat: Pick<TelegramChat, 'id' | 'username'>,
): Promise<void> {
  const { id: userId, username } = telegramChat;

  const input = Input.create({
    inputId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text,
  });

  await addInputToDB(input);
}

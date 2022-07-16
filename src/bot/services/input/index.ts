import { addInputToDB, Input } from '../../../models/Input';
import type { TelegramChat } from '../../../telegram';
import { currentDate } from '../../../utils/date';

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

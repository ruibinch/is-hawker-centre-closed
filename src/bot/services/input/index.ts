import { addInputToDB, Input } from '../../../models/Input';
import type { TelegramChat } from '../../../telegram';

export async function saveInput(
  text: string,
  telegramChat: Pick<TelegramChat, 'id' | 'username'>,
): Promise<void> {
  const { id: userId, username } = telegramChat;

  const input = Input.create({
    userId,
    username,
    text,
  });

  await addInputToDB(input);
}

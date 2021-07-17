import { addInputToDB, Input } from '../../models/Input';
import { currentDate } from '../../utils/date';
import { TelegramUser } from '../../utils/telegram';

export async function saveInput(
  text: string,
  telegramUser: TelegramUser,
): Promise<void> {
  const { id: userId, username } = telegramUser;

  const input = Input.create({
    inputId: `${userId}-${currentDate().getTime()}`,
    userId,
    username,
    text,
  });

  await addInputToDB(input);
}

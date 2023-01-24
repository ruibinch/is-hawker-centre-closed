import dotenv from 'dotenv';

import { sendNotifications } from '../bot/handlers/notificationsTrigger';
import type { NotificationMessage } from '../bot/services/notifications/types';
import { escapeCharacters } from '../telegram';

dotenv.config();

/**
 * Run this script via:
 * TELEGRAM_BOT_TOKEN={{telegramBotToken}} yarn ts-node src/scripts/sendNotifications.ts
 */
export async function run(): Promise<void> {
  const notifications: NotificationMessage[] = [
    {
      userId: 60238293,
      message: 'TESTING',
    },
  ].map((notification) => ({
    ...notification,
    message: escapeCharacters(notification.message),
  }));

  const notificationsResult = await sendNotifications(notifications);
  console.info('sendNotifications result', notificationsResult);
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

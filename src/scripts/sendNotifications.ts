import dotenv from 'dotenv';

import { sendNotifications } from '../bot/handlers/notificationsTrigger';
import type { NotificationMessage } from '../bot/services/notifications/types';

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
  ];

  const notificationsResult = await sendNotifications(notifications);
  console.info('sendNotifications result', notificationsResult);
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

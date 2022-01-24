import dotenv from 'dotenv';

import { sendNotifications } from '../handlers/notificationsTrigger';
import type { NotificationMessage } from '../services/notifications/types';

dotenv.config();

// Note: care should be taken when amending this to avoid sending notifications from prod bot
process.env.BOT_TOKEN = process.env.BOT_TOKEN_dev;

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

import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import { NotificationMessage } from './types';

export async function constructNotifications(): Promise<NotificationMessage[]> {
  const usersWithFavsClosedToday = await getUsersWithFavsClosedToday();

  const notifications = usersWithFavsClosedToday
    .filter((userWithResult) => userWithResult.results.length > 0)
    .map((userWithResult) => ({
      userId: userWithResult.userId,
      message: makeNotificationMessage(userWithResult.results),
    }));

  return notifications;
}

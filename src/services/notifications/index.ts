import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import { NotificationMessage } from './types';

export async function constructNotifications(): Promise<
  NotificationMessage[] | null
> {
  const usersWithFavsClosedToday = await getUsersWithFavsClosedToday();
  if (!usersWithFavsClosedToday.success) return null;

  const notifications = usersWithFavsClosedToday.output
    .filter((userWithResult) => userWithResult.results.length > 0)
    .map((userWithResult) => ({
      userId: userWithResult.userId,
      message: makeNotificationMessage(userWithResult.results),
    }));

  return notifications;
}

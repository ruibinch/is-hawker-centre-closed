import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import { NotificationMessage } from './types';

export async function constructNotifications(): Promise<
  NotificationMessage[] | null
> {
  const usersWithFavsClosedToday = await getUsersWithFavsClosedToday();
  if (!usersWithFavsClosedToday.success) return null;

  const notifications = usersWithFavsClosedToday.output
    .filter((userWithClosure) => userWithClosure.closures.length > 0)
    .map((userWithClosure) => ({
      userId: userWithClosure.userId,
      message: makeNotificationMessage(userWithClosure.closures),
    }));

  return notifications;
}

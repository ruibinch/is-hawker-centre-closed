import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import { NotificationMessage } from './types';

export async function constructNotifications(): Promise<
  NotificationMessage[] | null
> {
  const usersWithFavsClosedTodayResponse = await getUsersWithFavsClosedToday();
  if (usersWithFavsClosedTodayResponse.err) return null;

  const notifications = usersWithFavsClosedTodayResponse.val
    .filter((userWithClosure) => userWithClosure.closures.length > 0)
    .map((userWithClosure) => ({
      userId: userWithClosure.userId,
      message: makeNotificationMessage(userWithClosure.closures),
    }));

  return notifications;
}

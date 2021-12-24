import { Result, type ResultType } from '../../../../lib/Result';
import { initDictionary } from '../../lang';
import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import type { NotificationMessage } from './types';

export async function constructNotifications(): Promise<
  ResultType<NotificationMessage[], Error>
> {
  const usersWithFavsClosedTodayResponse = await getUsersWithFavsClosedToday();
  if (usersWithFavsClosedTodayResponse.isErr) {
    return usersWithFavsClosedTodayResponse;
  }

  const notifications = usersWithFavsClosedTodayResponse.value
    .filter((userWithClosure) => userWithClosure.closures.length > 0)
    .map((userWithClosure) => {
      const { userId, languageCode, closures } = userWithClosure;
      initDictionary(languageCode);

      return {
        userId,
        message: makeNotificationMessage(closures),
      };
    });

  return Result.Ok(notifications);
}

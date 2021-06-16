import { Err, Ok, Result } from 'ts-results';

import { CustomError } from '../../errors/CustomError';
import { initDictionary } from '../../lang';
import { getUsersWithFavsClosedToday } from './logic';
import { makeNotificationMessage } from './message';
import { NotificationMessage } from './types';

export async function constructNotifications(): Promise<
  Result<NotificationMessage[], CustomError>
> {
  const usersWithFavsClosedTodayResponse = await getUsersWithFavsClosedToday();
  if (usersWithFavsClosedTodayResponse.err)
    return Err(usersWithFavsClosedTodayResponse.val);

  const notifications = usersWithFavsClosedTodayResponse.val
    .filter((userWithClosure) => userWithClosure.closures.length > 0)
    .map((userWithClosure) => {
      const { userId, languageCode, closures } = userWithClosure;
      initDictionary(languageCode);

      return {
        userId,
        message: makeNotificationMessage(closures),
      };
    });

  return Ok(notifications);
}

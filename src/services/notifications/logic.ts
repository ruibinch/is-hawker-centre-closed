import { parseISO } from 'date-fns';
import { Err, Ok, Result } from 'ts-results';

import { CustomError } from '../../errors/CustomError';
import { getAllClosures } from '../../models/Closure';
import { getAllUsers } from '../../models/User';
import { currentDate, isWithinDateBounds } from '../../utils/date';
import { UserWithClosure } from './types';

/**
 * Returns a list of users along with their saved favourite hawker centres that are closed today.
 */
export async function getUsersWithFavsClosedToday(): Promise<
  Result<UserWithClosure[], CustomError>
> {
  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.err) return Err(getAllUsersResponse.val);
  const usersAll = getAllUsersResponse.val;

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.err) return Err(getAllClosuresResponse.val);
  const closuresAll = getAllClosuresResponse.val;

  const closuresCurrent = closuresAll.filter((closure) =>
    isWithinDateBounds(
      currentDate(),
      parseISO(closure.startDate),
      parseISO(closure.endDate),
    ),
  );

  const usersWithNotifications = usersAll.filter((user) => user.notifications);

  const usersWithFavsClosedToday = usersWithNotifications.reduce(
    (_usersWithFavsClosedToday: UserWithClosure[], user) => {
      const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);
      const applicableClosures = closuresCurrent.filter((closure) =>
        userFavHCIds.includes(closure.hawkerCentreId),
      );

      if (applicableClosures.length > 0) {
        _usersWithFavsClosedToday.push({
          userId: user.userId,
          closures: applicableClosures,
        });
      }
      return _usersWithFavsClosedToday;
    },
    [],
  );

  return Ok(usersWithFavsClosedToday);
}

import { parseISO } from 'date-fns';

import { getAllClosures } from '../../models/Closure';
import { getAllUsers } from '../../models/User';
import { currentDate, isWithinDateBounds } from '../../utils/date';
import { GetUsersWithFavsClosedTodayResponse, UserWithClosure } from './types';

/**
 * Returns a list of users along with their saved favourite hawker centres that are closed today.
 */
export async function getUsersWithFavsClosedToday(): Promise<GetUsersWithFavsClosedTodayResponse> {
  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.err) return { success: false };
  const usersAll = getAllUsersResponse.val;

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.err) return { success: false };
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

  return {
    success: true,
    output: usersWithFavsClosedToday,
  };
}

import { parseISO } from 'date-fns';

import { getAllResults } from '../../models/Result';
import { Result, User } from '../../models/types';
import { getAllUsers } from '../../models/User';
import { currentDate, isWithinDateBounds } from '../../utils/date';
import { UserWithResult } from './types';

/**
 * Returns a list of users along with their saved favourite hawker centres that are closed today.
 */
export async function getUsersWithFavsClosedToday(): Promise<
  UserWithResult[] | null
> {
  const getAllUsersResponse = await getAllUsers();
  if (!getAllUsersResponse.success) return null;
  const usersAll = getAllUsersResponse.output as User[];

  const getAllResultsResponse = await getAllResults();
  if (!getAllResultsResponse.success) return null;
  const resultsAll = getAllResultsResponse.output as Result[];

  const resultsCurrent = resultsAll.filter((result) =>
    isWithinDateBounds(
      currentDate(),
      parseISO(result.startDate),
      parseISO(result.endDate),
    ),
  );

  const usersWithNotifications = usersAll.filter((user) => user.notifications);

  const usersWithFavsClosedToday = usersWithNotifications.reduce(
    (_usersWithFavsClosedToday: UserWithResult[], user) => {
      const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);
      const applicableResults = resultsCurrent.filter((result) =>
        userFavHCIds.includes(result.hawkerCentreId),
      );

      if (applicableResults.length > 0) {
        _usersWithFavsClosedToday.push({
          userId: user.userId,
          results: applicableResults,
        });
      }
      return _usersWithFavsClosedToday;
    },
    [],
  );

  return usersWithFavsClosedToday;
}

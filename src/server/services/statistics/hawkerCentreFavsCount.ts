import { HawkerCentre } from '../../../models/HawkerCentre';
import { User } from '../../../models/User';

type Props = {
  users: User[];
  hawkerCentres: HawkerCentre[];
};

export function calculateHawkerCentreFavsCount({
  users,
  hawkerCentres,
}: Props) {
  const hawkerCentreIdToCountMap = users.reduce(
    (countMap: Record<string, number>, user) => {
      user.favourites.forEach(({ hawkerCentreId }) => {
        countMap[hawkerCentreId] = (countMap[hawkerCentreId] ?? 0) + 1;
      });
      return countMap;
    },
    {},
  );

  const hawkerCentresWithFavouritesCount = hawkerCentres.map(
    (hawkerCentre) => ({
      ...hawkerCentre,
      count: hawkerCentreIdToCountMap[hawkerCentre.hawkerCentreId] ?? 0,
    }),
  );

  return hawkerCentresWithFavouritesCount;
}

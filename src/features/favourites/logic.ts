/* eslint-disable max-len */
import {
  addUser,
  getAllHawkerCentres,
  getUserById,
  updateUser,
} from '../../common/dynamodb';
import { TelegramUser } from '../../common/telegram';
import { HawkerCentreInfo, User } from '../../common/types';
import { MAX_CHOICES } from './constants';
import { AddHCResponse, FindHCResponse } from './types';

const FAVOURITES_COMMANDS = ['/fav', '/list'];

export function isFavouritesCommand(s: string): boolean {
  const [command] = s.split(' ');
  return FAVOURITES_COMMANDS.includes(command);
}

export async function findHCByKeyword(
  keyword: string,
): Promise<FindHCResponse | null> {
  return getAllHawkerCentres()
    .then((response) => {
      const items = response.Items as HawkerCentreInfo[];

      const hcFilteredByKeyword = filterByKeyword(items, keyword);

      // if there is only 1 result and the keyword is an exact match,
      // assume that this is after input selection, hence add to favourites
      if (hcFilteredByKeyword.length === 1) {
        if (keyword === hcFilteredByKeyword[0].name) {
          return {
            isExactMatch: true,
            hawkerCentres: hcFilteredByKeyword,
          };
        }
      }

      if (
        hcFilteredByKeyword.length === 0 ||
        hcFilteredByKeyword.length > MAX_CHOICES
      ) {
        return {
          isFindError: true,
          hawkerCentres: [],
        };
      }

      return {
        isFindError: false,
        hawkerCentres: hcFilteredByKeyword,
      };
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
}

/**
 * Adds a hawker centre to the user's favourites list.
 *
 * If the user does not exist yet in the DB, create the user.
 * If the user exists but the hawker centre already exists in the favourites list, return a duplicate error.
 */
export async function addHCToFavourites(props: {
  hawkerCentre: HawkerCentreInfo;
  telegramUser: TelegramUser;
}): Promise<AddHCResponse | null> {
  const {
    hawkerCentre: { hawkerCentreId },
    telegramUser: { id: userId, language_code: languageCode },
  } = props;

  return getUserById(userId).then((getUserResponse) => {
    if (!getUserResponse.Item) {
      // user does not exist yet in DB
      const newUser: User = {
        userId,
        languageCode,
        favourites: [hawkerCentreId],
      };

      return addUser(newUser)
        .then(() => {
          console.log(`Successfully added user: ${userId}`);
          return {
            success: true,
          };
        })
        .catch((error) => {
          console.log(error);
          return null;
        });
    }

    const user = getUserResponse.Item as User;

    // Check if hawker centre already exists in the favourites list
    if (user.favourites.includes(hawkerCentreId)) {
      return {
        success: false,
        isDuplicate: true,
      };
    }

    const favouritesUpdated = [...user.favourites, hawkerCentreId];

    return updateUser(userId, favouritesUpdated)
      .then(() => {
        console.log(`Successfully updated user: ${userId}`);
        return {
          success: true,
        };
      })
      .catch((error) => {
        console.log(error);
        return null;
      });
  });
}

/**
 * Returns the user's favourites list, or an empty list if the user does not exist.
 * Implicitly sorted by hawkerCentreId field.
 */
export async function getUserFavourites(
  telegramUser: TelegramUser,
): Promise<HawkerCentreInfo[] | null> {
  const { id: userId } = telegramUser;

  return getUserById(userId).then((getUserResponse) => {
    if (!getUserResponse.Item) {
      // user does not exist in DB
      return [];
    }

    const user = getUserResponse.Item as User;
    const { favourites: userFavourites } = user;

    return getAllHawkerCentres()
      .then((getHCResponse) => {
        const hawkerCentres = getHCResponse.Items as HawkerCentreInfo[];

        return hawkerCentres.filter((hc) =>
          userFavourites.includes(hc.hawkerCentreId),
        );
      })
      .catch((error) => {
        console.log(error);
        return null;
      });
  });
}

/**
 * Filters the list of items by keyword matching the hawker centre name(s).
 */
function filterByKeyword(
  items: HawkerCentreInfo[],
  keyword: string,
): HawkerCentreInfo[] {
  if (keyword === '') {
    return [];
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return items.filter(
    (item) =>
      filterRegex.test(item.name.toLowerCase()) ||
      (item.nameSecondary &&
        filterRegex.test(item.nameSecondary.toLowerCase())),
  );
}

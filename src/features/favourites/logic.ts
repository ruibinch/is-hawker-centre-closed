/* eslint-disable max-len */
import { formatISO } from 'date-fns';

import { currentDate } from '../../common/date';
import {
  addUser,
  getAllHawkerCentres,
  getUserById,
  updateUser,
} from '../../common/dynamodb';
import { TelegramUser } from '../../common/telegram';
import { HawkerCentreInfo, User, UserFavourite } from '../../common/types';
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
  const getAllHCResponse = await getAllHawkerCentres();

  const hawkerCentres = getAllHCResponse.Items as HawkerCentreInfo[];
  const hcFilteredByKeyword = filterByKeyword(hawkerCentres, keyword);

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
    telegramUser: { id: userId, username, language_code: languageCode },
  } = props;

  const addFavHC: UserFavourite = {
    hawkerCentreId,
    dateAdded: formatISO(currentDate()),
  };

  const getUserResponse = await getUserById(userId);

  if (!getUserResponse.Item) {
    // user does not exist yet in DB
    const newUser: User = {
      userId,
      username,
      languageCode,
      favourites: [addFavHC],
    };

    addUser(newUser);

    console.log(`Successfully added user: ${userId}`);
    return { success: true };
  }

  const user = getUserResponse.Item as User;

  // Check if hawker centre already exists in the favourites list
  if (user.favourites.includes(addFavHC)) {
    return {
      success: false,
      isDuplicate: true,
    };
  }

  const favouritesUpdated = [...user.favourites, addFavHC];

  updateUser(userId, favouritesUpdated);

  console.log(`Successfully updated user: ${userId}`);
  return { success: true };
}

/**
 * Returns the user's favourites list, or an empty list if the user does not exist.
 * Implicitly sorted by hawkerCentreId field.
 */
export async function getUserFavourites(
  telegramUser: TelegramUser,
): Promise<HawkerCentreInfo[] | null> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (!getUserResponse.Item) {
    // user does not exist in DB
    return [];
  }

  const user = getUserResponse.Item as User;
  const userFavourites = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllHCResponse = await getAllHawkerCentres();

  const hawkerCentres = getAllHCResponse.Items as HawkerCentreInfo[];
  return hawkerCentres.filter((hc) =>
    userFavourites.includes(hc.hawkerCentreId),
  );
}

/**
 * Filters the list of hawker centres by keyword matching the hawker centre name(s).
 */
function filterByKeyword(
  hawkerCentres: HawkerCentreInfo[],
  keyword: string,
): HawkerCentreInfo[] {
  if (keyword === '') {
    return [];
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return hawkerCentres.filter(
    (hc) =>
      filterRegex.test(hc.name.toLowerCase()) ||
      (hc.nameSecondary && filterRegex.test(hc.nameSecondary.toLowerCase())),
  );
}

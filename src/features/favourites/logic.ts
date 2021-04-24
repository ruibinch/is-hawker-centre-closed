/* eslint-disable max-len */
import { formatISO } from 'date-fns';

import { currentDate } from '../../common/date';
import {
  addUser,
  getAllHawkerCentres,
  getHawkerCentreById,
  getUserById,
  updateUser,
} from '../../common/dynamodb';
import { TelegramUser } from '../../common/telegram';
import { HawkerCentreInfo, User, UserFavourite } from '../../common/types';
import { MAX_CHOICES } from './constants';
import { AddHCResponse, DeleteHCResponse, FindHCResponse } from './types';

const FAVOURITES_COMMANDS = ['/fav', '/del', '/list'];

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

    return { success: true };
  }

  const user = getUserResponse.Item as User;
  const userFavourites = user.favourites.map((fav) => fav.hawkerCentreId);

  // Check if hawker centre already exists in the favourites list
  if (userFavourites.includes(addFavHC.hawkerCentreId)) {
    return {
      success: false,
      isDuplicate: true,
    };
  }

  // Save list in ascending order of hawkerCentreId
  const favouritesUpdated = [...user.favourites, addFavHC].sort(
    (a, b) => a.hawkerCentreId - b.hawkerCentreId,
  );

  updateUser(userId, favouritesUpdated);
  return { success: true };
}

export async function deleteHCFromFavourites(props: {
  deleteIdx: number;
  telegramUser: TelegramUser;
}): Promise<DeleteHCResponse | null> {
  const {
    deleteIdx,
    telegramUser: { id: userId },
  } = props;

  const getUserResponse = await getUserById(userId);

  if (!getUserResponse.Item) {
    return null;
  }

  const user = getUserResponse.Item as User;

  if (deleteIdx < 0 || deleteIdx >= user.favourites.length) {
    // out of bounds
    return {
      success: false,
      numFavourites: user.favourites.length,
    };
  }

  // get details of HC to be deleted
  const delHawkerCentreId = user.favourites[deleteIdx].hawkerCentreId;
  const getHCByIdResponse = await getHawkerCentreById(delHawkerCentreId);
  if (getHCByIdResponse === null) return null;

  const delHawkerCentre = getHCByIdResponse.Item as HawkerCentreInfo;

  const favouritesUpdated = [...user.favourites];
  favouritesUpdated.splice(deleteIdx, 1);

  updateUser(userId, favouritesUpdated);
  return {
    success: true,
    hawkerCentre: delHawkerCentre,
  };
}

/**
 * Returns the user's favourites list, or an empty list if the user does not exist.
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
  const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllHCResponse = await getAllHawkerCentres();
  const hawkerCentres = getAllHCResponse.Items as HawkerCentreInfo[];

  const userFavs = userFavHCIds.map((favHCId) => {
    const hawkerCentre = hawkerCentres.find(
      (hc) => hc.hawkerCentreId === favHCId,
    );
    if (!hawkerCentre) {
      throw new Error(
        `Missing hawker centre entry for hawkerCentreId ${favHCId}`,
      );
    }
    return hawkerCentre;
  });

  return userFavs;
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

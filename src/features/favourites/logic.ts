/* eslint-disable max-len */
import { formatISO, isPast, parseISO } from 'date-fns';

import { currentDate } from '../../common/date';
import { TelegramUser } from '../../common/telegram';
import {
  getAllHawkerCentres,
  getHawkerCentreById,
} from '../../models/HawkerCentre';
import { getAllResults } from '../../models/Result';
import {
  HawkerCentreInfo,
  Result,
  ResultPartial,
  User,
  UserFavourite,
} from '../../models/types';
import {
  getUserById,
  addUser,
  updateUserFavourites,
  updateUserInFavouritesMode,
} from '../../models/User';
import { sortInDateAscThenAlphabeticalOrder } from '../search';
import { MAX_CHOICES } from './constants';
import {
  AddHCResponse,
  DeleteHCResponse,
  FindHCResponse,
  IsUserInFavModeResponse,
  ToggleUserInFavModeResponse,
} from './types';

export async function findHCByKeyword(
  keyword: string,
): Promise<FindHCResponse | null> {
  const getAllHCResponse = await getAllHawkerCentres();
  if (!getAllHCResponse.Items) return null;

  const hawkerCentres = getAllHCResponse.Items as HawkerCentreInfo[];
  const hcFilteredByKeyword = filterByKeyword(hawkerCentres, keyword);

  // if there is only 1 result and the keyword is an exact match, return `isExactMatch` set to true
  if (hcFilteredByKeyword.length === 1) {
    if (keyword === hcFilteredByKeyword[0].name) {
      return {
        isExactMatch: true,
        hawkerCentres: hcFilteredByKeyword,
      };
    }
  }

  const isFindError =
    hcFilteredByKeyword.length === 0 ||
    hcFilteredByKeyword.length > MAX_CHOICES;

  return {
    isFindError,
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
      isInFavouritesMode: false,
    };

    await addUser(newUser);
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

  await updateUserFavourites(userId, favouritesUpdated);
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
    // user does not exist
    return {
      success: false,
      numFavourites: 0,
    };
  }

  const user = getUserResponse.Item as User;

  if (
    Number.isNaN(deleteIdx) ||
    deleteIdx < 0 ||
    deleteIdx >= user.favourites.length
  ) {
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

  await updateUserFavourites(userId, favouritesUpdated);
  return {
    success: true,
    hawkerCentre: delHawkerCentre,
  };
}

/**
 * Returns the user's favourites list, along with the results of their next closure times.
 */
export async function getUserFavouritesWithResults(
  telegramUser: TelegramUser,
): Promise<ResultPartial[] | null> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);
  if (!getUserResponse.Item) {
    // user does not exist in DB
    return [];
  }

  const user = getUserResponse.Item as User;
  const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllResultsResponse = await getAllResults();
  const resultsAll = getAllResultsResponse.Items as Result[];

  const getAllHCResponse = await getAllHawkerCentres();
  const hawkerCentres = getAllHCResponse.Items as HawkerCentreInfo[];

  const userFavsWithResults = userFavHCIds.map((favHCId) => {
    const resultsForHawkerCentre = resultsAll.filter(
      (result) => result.hawkerCentreId === favHCId,
    );

    const nextOccurringResult = getNextOccurringResult(resultsForHawkerCentre);

    // if there is no next occurring result, fallback to returning the basic info
    if (!nextOccurringResult) {
      const hawkerCentre = hawkerCentres.find(
        (hc) => hc.hawkerCentreId === favHCId,
      );
      if (!hawkerCentre) {
        throw new Error(
          `Missing hawker centre entry for hawkerCentreId ${favHCId}`,
        );
      }
      return hawkerCentre;
    }

    return nextOccurringResult;
  });

  return userFavsWithResults;
}

/**
 * Returns the `isInFavouritesMode` value of the associated user.
 */
export async function isUserInFavouritesMode(
  telegramUser: TelegramUser,
): Promise<IsUserInFavModeResponse> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (!getUserResponse.Item) {
    // user does not exist in DB
    return {
      success: false,
    };
  }

  const user = getUserResponse.Item as User;
  return {
    success: true,
    isInFavouritesMode: user.isInFavouritesMode,
  };
}

/**
 * Toggles the `isInFavouritesMode` value of the associated user.
 */
export async function toggleUserInFavouritesMode(
  telegramUser: TelegramUser,
  isInFavouritesMode: boolean,
): Promise<ToggleUserInFavModeResponse> {
  const { id: userId, username, language_code: languageCode } = telegramUser;

  // TODO: potentially improve this flow
  const getUserResponse = await getUserById(userId);
  if (!getUserResponse.Item) {
    // user does not exist yet in DB
    const newUser: User = {
      userId,
      username,
      languageCode,
      favourites: [],
      isInFavouritesMode,
    };

    await addUser(newUser);
    return { success: true };
  }

  await updateUserInFavouritesMode(userId, isInFavouritesMode);
  return { success: true };
}

/**
 * Filters the list of hawker centres by keyword matching the hawker centre name or secondary name.
 */
function filterByKeyword(
  hawkerCentres: HawkerCentreInfo[],
  keyword: string,
): HawkerCentreInfo[] {
  if (keyword === '') {
    return [];
  }

  const searchKeywords = keyword.split(' ');

  return hawkerCentres.filter((hc) =>
    searchKeywords.every((searchKeyword) => {
      const filterRegex = new RegExp(`\\b${searchKeyword.toLowerCase()}`);
      return (
        filterRegex.test(hc.name.toLowerCase()) ||
        (hc.nameSecondary && filterRegex.test(hc.nameSecondary.toLowerCase()))
      );
    }),
  );
}

/**
 * Returns the result entry that is the next to occur w.r.t. the current date (includes results occurring today).
 */
function getNextOccurringResult(results: Result[]): Result | undefined {
  const resultsSorted = sortInDateAscThenAlphabeticalOrder(results);

  const resultsSortedAndFiltered = resultsSorted.filter(
    (result) => !isPast(parseISO(result.startDate)),
  );

  return resultsSortedAndFiltered[0];
}

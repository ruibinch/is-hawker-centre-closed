/* eslint-disable max-len */
import { formatISO, isPast, parseISO } from 'date-fns';

import {
  getAllHawkerCentres,
  getHawkerCentreById,
} from '../../models/HawkerCentre';
import { getAllResults } from '../../models/Result';
import { HawkerCentre, Result, User, UserFavourite } from '../../models/types';
import {
  getUserById,
  addUser,
  updateUserFavourites,
  updateUserInFavouritesMode,
  updateUserNotifications,
} from '../../models/User';
import { currentDate } from '../../utils/date';
import { TelegramUser } from '../../utils/telegram';
import { sortInDateAscThenAlphabeticalOrder } from '../search';
import {
  MAX_CHOICES,
  NOTIFICATION_OFF_KEYWORDS,
  NOTIFICATION_ON_KEYWORDS,
} from './constants';
import {
  AddHCResponse,
  DeleteHCResponse,
  FindHCResponse,
  GetUserFavsWithResultsResponse,
  IsUserInFavModeResponse,
  ManageNotificationsResponse,
  ToggleUserInFavModeResponse,
} from './types';

export async function findHCByKeyword(
  keyword: string,
): Promise<FindHCResponse> {
  const getAllHCResponse = await getAllHawkerCentres();
  if (!getAllHCResponse.success) return { success: false };

  const hawkerCentres = getAllHCResponse.output as HawkerCentre[];
  const hcFilteredByKeyword = filterByKeyword(hawkerCentres, keyword);

  // if there is only 1 result and the keyword is an exact match, return `isExactMatch` set to true
  if (hcFilteredByKeyword.length === 1) {
    if (keyword === hcFilteredByKeyword[0].name) {
      return {
        success: true,
        isExactMatch: true,
        hawkerCentres: hcFilteredByKeyword,
      };
    }
  }

  const isFindError =
    hcFilteredByKeyword.length === 0 ||
    hcFilteredByKeyword.length > MAX_CHOICES;

  return {
    success: true,
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
  hawkerCentre: HawkerCentre;
  telegramUser: TelegramUser;
}): Promise<AddHCResponse> {
  const {
    hawkerCentre: { hawkerCentreId },
    telegramUser: { id: userId, username, language_code: languageCode },
  } = props;

  const addFavHC: UserFavourite = {
    hawkerCentreId,
    dateAdded: formatISO(currentDate()),
  };

  const getUserResponse = await getUserById(userId);
  if (!getUserResponse.success) {
    // user does not exist yet in DB
    const newUser: User = {
      userId,
      username,
      languageCode,
      favourites: [addFavHC],
      isInFavouritesMode: false,
      notifications: true,
    };

    const dbResponse = await addUser(newUser);
    return { success: dbResponse.success };
  }

  const user = getUserResponse.output as User;
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

  const dbResponse = await updateUserFavourites(userId, favouritesUpdated);
  return { success: dbResponse.success };
}

export async function deleteHCFromFavourites(props: {
  deleteIdx: number;
  telegramUser: TelegramUser;
}): Promise<DeleteHCResponse> {
  const {
    deleteIdx,
    telegramUser: { id: userId },
  } = props;

  const getUserResponse = await getUserById(userId);
  if (!getUserResponse.success) {
    // user does not exist
    return {
      success: false,
      isError: false,
      numFavourites: 0,
    };
  }

  const user = getUserResponse.output as User;

  if (
    Number.isNaN(deleteIdx) ||
    deleteIdx < 0 ||
    deleteIdx >= user.favourites.length
  ) {
    // out of bounds
    return {
      success: false,
      isError: false,
      numFavourites: user.favourites.length,
    };
  }

  // get details of HC to be deleted
  const delHawkerCentreId = user.favourites[deleteIdx].hawkerCentreId;
  const getHCByIdResponse = await getHawkerCentreById(delHawkerCentreId);
  if (!getHCByIdResponse.success) return { success: false, isError: true };

  const delHawkerCentre = getHCByIdResponse.output as HawkerCentre;

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
): Promise<GetUserFavsWithResultsResponse> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);
  if (!getUserResponse.success) {
    // user does not exist in DB
    return {
      success: true,
      results: [],
    };
  }

  const user = getUserResponse.output as User;
  const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllResultsResponse = await getAllResults();
  if (!getAllResultsResponse.success) return { success: false };
  const resultsAll = getAllResultsResponse.output as Result[];

  const getAllHCResponse = await getAllHawkerCentres();
  if (!getAllHCResponse.success) return { success: false };
  const hawkerCentres = getAllHCResponse.output as HawkerCentre[];

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

  return {
    success: true,
    results: userFavsWithResults,
  };
}

/**
 * Returns the `isInFavouritesMode` value of the associated user.
 */
export async function isUserInFavouritesMode(
  telegramUser: TelegramUser,
): Promise<IsUserInFavModeResponse> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (!getUserResponse.success) {
    // user does not exist in DB
    return {
      success: false,
    };
  }

  const user = getUserResponse.output as User;
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
  if (!getUserResponse.success) {
    // user does not exist yet in DB
    const newUser: User = {
      userId,
      username,
      languageCode,
      favourites: [],
      isInFavouritesMode,
      notifications: true,
    };

    await addUser(newUser);
  } else {
    await updateUserInFavouritesMode(userId, isInFavouritesMode);
  }

  return { success: true };
}

/**
 * Toggles the `notifications` value of the associated user, if an appropriate keyword is specified.
 *
 * Else, it returns the current notification setting of the user.
 */
export async function manageNotifications(props: {
  keyword: string;
  telegramUser: TelegramUser;
}): Promise<ManageNotificationsResponse> {
  const {
    keyword,
    telegramUser: { id: userId, username, language_code: languageCode },
  } = props;

  // TODO: potentially improve this flow
  const getUserResponse = await getUserById(userId);

  // empty keyword is equivalent to only reading the current notifications value
  if (keyword === '') {
    let currentValue: boolean | undefined;

    if (getUserResponse.success) {
      const user = getUserResponse.output as User;
      currentValue = user.notifications;
    }

    return {
      operation: 'read',
      currentValue,
    };
  }

  const newNotificationsValue = (() => {
    if (NOTIFICATION_ON_KEYWORDS.includes(keyword.toLowerCase())) {
      return true;
    }
    if (NOTIFICATION_OFF_KEYWORDS.includes(keyword.toLowerCase())) {
      return false;
    }
    return undefined;
  })();

  if (newNotificationsValue !== undefined) {
    if (!getUserResponse.success) {
      // user does not exist yet in DB
      const newUser: User = {
        userId,
        username,
        languageCode,
        favourites: [],
        isInFavouritesMode: false,
        notifications: newNotificationsValue,
      };

      await addUser(newUser);
    } else {
      await updateUserNotifications(userId, newNotificationsValue);
    }
  }

  return {
    operation: 'write',
    newValue: newNotificationsValue,
  };
}

/**
 * Filters the list of hawker centres by keyword matching the hawker centre name or secondary name.
 */
function filterByKeyword(
  hawkerCentres: HawkerCentre[],
  keyword: string,
): HawkerCentre[] {
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
    (result) => !isPast(parseISO(result.endDate)),
  );

  return resultsSortedAndFiltered[0];
}

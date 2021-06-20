/* eslint-disable max-len */
import { endOfDay, formatISO, isPast, parseISO } from 'date-fns';
import { Err, Ok, Result } from 'ts-results';

import { CustomError } from '../../errors/CustomError';
import { Closure, getAllClosures } from '../../models/Closure';
import {
  getAllHawkerCentres,
  getHawkerCentreById,
  HawkerCentre,
} from '../../models/HawkerCentre';
import {
  getUserById,
  addUser,
  updateUserFavourites,
  updateUserInFavouritesMode,
  updateUserNotifications,
  User,
  UserFavourite,
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
  DeleteHCResponseError,
  DeleteHCResponseOk,
  FindHCResponse,
  GetUserFavsWithClosuresResponse,
  IsUserInFavModeResponse,
  ManageNotificationsResponse,
} from './types';

export async function findHCByKeyword(
  keyword: string,
): Promise<Result<FindHCResponse, CustomError>> {
  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllHCResponse.err) return Err(getAllHCResponse.val);

  const hawkerCentres = getAllHCResponse.val;
  const hcFilteredByKeyword = filterByKeyword(hawkerCentres, keyword);

  // if there is only 1 HC result and the keyword is an exact match, return `isExactMatch` set to true
  if (hcFilteredByKeyword.length === 1) {
    if (keyword === hcFilteredByKeyword[0].name) {
      return Ok({
        isExactMatch: true,
        hawkerCentres: hcFilteredByKeyword,
      });
    }
  }

  const isFindError =
    hcFilteredByKeyword.length === 0 ||
    hcFilteredByKeyword.length > MAX_CHOICES;

  return Ok({
    isFindError,
    hawkerCentres: hcFilteredByKeyword,
  });
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
}): Promise<Result<AddHCResponse, CustomError>> {
  const {
    hawkerCentre: { hawkerCentreId },
    telegramUser: { id: userId, username },
  } = props;

  const addFavHC: UserFavourite = {
    hawkerCentreId,
    dateAdded: formatISO(currentDate()),
  };

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.err) {
    // user does not exist yet in DB
    const newUser = User.create({
      userId,
      username,
      languageCode: 'en',
      favourites: [addFavHC],
      isInFavouritesMode: false,
      notifications: true,
    });

    await addUser(newUser);
    return Ok({});
  }

  const user = getUserResponse.val;
  const userFavourites = user.favourites.map((fav) => fav.hawkerCentreId);

  // Check if hawker centre already exists in the favourites list
  if (userFavourites.includes(addFavHC.hawkerCentreId)) {
    return Ok({
      isDuplicate: true,
    });
  }

  // Save list in ascending order of hawkerCentreId
  const favouritesUpdated = [...user.favourites, addFavHC].sort(
    (a, b) => a.hawkerCentreId - b.hawkerCentreId,
  );

  await updateUserFavourites(userId, favouritesUpdated);
  return Ok({});
}

export async function deleteHCFromFavourites(props: {
  deleteIdx: number;
  telegramUser: TelegramUser;
}): Promise<Result<DeleteHCResponseOk, CustomError | DeleteHCResponseError>> {
  const {
    deleteIdx,
    telegramUser: { id: userId },
  } = props;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.err) {
    // user does not exist
    return Err({
      numFavourites: 0,
    });
  }

  const user = getUserResponse.val;

  if (
    Number.isNaN(deleteIdx) ||
    deleteIdx < 0 ||
    deleteIdx >= user.favourites.length
  ) {
    // out of bounds
    return Err({
      numFavourites: user.favourites.length,
    });
  }

  // get details of HC to be deleted
  const delHawkerCentreId = user.favourites[deleteIdx].hawkerCentreId;
  const getHCByIdResponse = await getHawkerCentreById(delHawkerCentreId);
  if (getHCByIdResponse.err) return Err(getHCByIdResponse.val);

  const delHawkerCentre = getHCByIdResponse.val;

  const favouritesUpdated = [...user.favourites];
  favouritesUpdated.splice(deleteIdx, 1);

  await updateUserFavourites(userId, favouritesUpdated);
  return Ok({
    hawkerCentre: delHawkerCentre,
  });
}

/**
 * Returns the user's favourites list, along with the results of their next closure times.
 */
export async function getUserFavouritesWithClosures(
  telegramUser: TelegramUser,
): Promise<Result<GetUserFavsWithClosuresResponse, CustomError>> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.err) {
    // user does not exist in DB
    return Ok({
      closures: [],
    });
  }

  const user = getUserResponse.val;
  const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.err) return Err(getAllClosuresResponse.val);
  const closuresAll = getAllClosuresResponse.val;

  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllHCResponse.err) return Err(getAllHCResponse.val);
  const hawkerCentres = getAllHCResponse.val;

  const userFavsWithClosures = userFavHCIds.map((favHCId) => {
    const closuresForHawkerCentre = closuresAll.filter(
      (closure) => closure.hawkerCentreId === favHCId,
    );

    const nextOccurringClosure = getNextOccurringClosure(
      closuresForHawkerCentre,
    );

    // if there is no next occurring closure, fallback to returning the basic info
    if (!nextOccurringClosure) {
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

    return nextOccurringClosure;
  });

  return Ok({
    closures: userFavsWithClosures,
  });
}

/**
 * Returns the `isInFavouritesMode` value of the associated user.
 */
export async function isUserInFavouritesMode(
  telegramUser: TelegramUser,
): Promise<Result<IsUserInFavModeResponse, CustomError>> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (getUserResponse.err) {
    // user does not exist in DB
    return Err(getUserResponse.val);
  }

  const user = getUserResponse.val;
  return Ok({
    isInFavouritesMode: user.isInFavouritesMode,
  });
}

/**
 * Toggles the `isInFavouritesMode` value of the associated user.
 */
export async function toggleUserInFavouritesMode(
  telegramUser: TelegramUser,
  isInFavouritesMode: boolean,
): Promise<Result<void, void>> {
  const { id: userId, username } = telegramUser;

  // TODO: potentially improve this flow
  const getUserResponse = await getUserById(userId);
  if (getUserResponse.err) {
    // user does not exist yet in DB
    const newUser = User.create({
      userId,
      username,
      languageCode: 'en',
      favourites: [],
      isInFavouritesMode,
      notifications: true,
    });

    await addUser(newUser);
  } else {
    await updateUserInFavouritesMode(userId, isInFavouritesMode);
  }

  return Ok.EMPTY;
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
    telegramUser: { id: userId, username },
  } = props;

  // TODO: potentially improve this flow
  const getUserResponse = await getUserById(userId);

  // empty keyword is equivalent to only reading the current notifications value
  if (keyword === '') {
    let currentValue: boolean | undefined;

    if (getUserResponse.ok) {
      const user = getUserResponse.val;
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
    if (getUserResponse.err) {
      // user does not exist yet in DB
      const newUser = User.create({
        userId,
        username,
        languageCode: 'en',
        favourites: [],
        isInFavouritesMode: false,
        notifications: newNotificationsValue,
      });

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
 * Returns the closure entry that is the next to occur w.r.t. the current date (includes closures occurring today).
 */
function getNextOccurringClosure(closures: Closure[]): Closure | undefined {
  const closuresSorted = sortInDateAscThenAlphabeticalOrder(closures);

  const closuresSortedAndFiltered = closuresSorted.filter(
    (closure) => !isPast(endOfDay(parseISO(closure.endDate))),
  );

  return closuresSortedAndFiltered[0];
}

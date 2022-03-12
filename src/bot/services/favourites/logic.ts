/* eslint-disable max-len */
import { formatISO } from 'date-fns';

import { Result, type ResultType } from '../../../lib/Result';
import { getAllClosures } from '../../../models/Closure';
import {
  getAllHawkerCentres,
  getHawkerCentreById,
  HawkerCentre,
} from '../../../models/HawkerCentre';
import {
  getUserById,
  addUser,
  updateUserFavourites,
  updateUserInFavouritesMode,
  updateUserNotifications,
  User,
  UserFavourite,
} from '../../../models/User';
import { currentDate } from '../../../utils/date';
import type { TelegramUser } from '../../telegram';
import { getNextOccurringClosure } from '../helpers';
import {
  MAX_CHOICES,
  NOTIFICATION_OFF_KEYWORDS,
  NOTIFICATION_ON_KEYWORDS,
} from './constants';
import type {
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
): Promise<ResultType<FindHCResponse, Error>> {
  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllHCResponse.isErr) return getAllHCResponse;

  const hawkerCentres = getAllHCResponse.value;
  const hcFilteredByKeyword = filterByKeyword(hawkerCentres, keyword);

  // if there is only 1 HC result and the keyword is an exact match, return `isExactMatch` set to true
  if (hcFilteredByKeyword.length === 1) {
    if (keyword === hcFilteredByKeyword[0].name) {
      return Result.Ok({
        isExactMatch: true,
        hawkerCentres: hcFilteredByKeyword,
      });
    }
  }

  const isFindError =
    hcFilteredByKeyword.length === 0 ||
    hcFilteredByKeyword.length > MAX_CHOICES;

  return Result.Ok({
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
}): Promise<ResultType<AddHCResponse, Error>> {
  const {
    hawkerCentre: { hawkerCentreId },
    telegramUser: { id: userId, username },
  } = props;

  const addFavHC: UserFavourite = {
    hawkerCentreId,
    dateAdded: formatISO(currentDate()),
  };

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.isErr) {
    // user does not exist yet in DB
    const newUser = User.create({
      userId,
      username,
      languageCode: 'en',
      favourites: [addFavHC],
      isInFavouritesMode: false,
      notifications: true,
    });

    const addUserResponse = await addUser(newUser);
    if (addUserResponse.isErr) return addUserResponse;

    return Result.Ok({});
  }

  const user = getUserResponse.value;
  const userFavourites = user.favourites.map((fav) => fav.hawkerCentreId);

  // Check if hawker centre already exists in the favourites list
  if (userFavourites.includes(addFavHC.hawkerCentreId)) {
    return Result.Ok({
      isDuplicate: true,
    });
  }

  // Save list in ascending order of hawkerCentreId
  const favouritesUpdated = [...user.favourites, addFavHC].sort(
    (a, b) => a.hawkerCentreId - b.hawkerCentreId,
  );

  const updateUserResponse = await updateUserFavourites(
    userId,
    favouritesUpdated,
  );
  if (updateUserResponse.isErr) return updateUserResponse;

  return Result.Ok({});
}

export async function deleteHCFromFavourites(props: {
  deleteIdx: number;
  telegramUser: TelegramUser;
}): Promise<ResultType<DeleteHCResponseOk, Error | DeleteHCResponseError>> {
  const {
    deleteIdx,
    telegramUser: { id: userId },
  } = props;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.isErr) {
    // user does not exist
    return Result.Err({
      numFavourites: 0,
    });
  }

  const user = getUserResponse.value;

  if (
    Number.isNaN(deleteIdx) ||
    deleteIdx < 0 ||
    deleteIdx >= user.favourites.length
  ) {
    // out of bounds
    return Result.Err({
      numFavourites: user.favourites.length,
    });
  }

  // get details of HC to be deleted
  const delHawkerCentreId = user.favourites[deleteIdx].hawkerCentreId;
  const getHCByIdResponse = await getHawkerCentreById(delHawkerCentreId);
  if (getHCByIdResponse.isErr) return getHCByIdResponse;

  const delHawkerCentre = getHCByIdResponse.value;

  const favouritesUpdated = [...user.favourites];
  favouritesUpdated.splice(deleteIdx, 1);

  const updateUserResponse = await updateUserFavourites(
    userId,
    favouritesUpdated,
  );
  if (updateUserResponse.isErr) return updateUserResponse;

  return Result.Ok({
    hawkerCentre: delHawkerCentre,
  });
}

/**
 * Returns the user's favourites list, along with the results of their next closure times.
 */
export async function getUserFavouritesWithClosures(
  telegramUser: TelegramUser,
): Promise<ResultType<GetUserFavsWithClosuresResponse, Error>> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);
  if (getUserResponse.isErr) {
    // user does not exist in DB
    return Result.Ok({
      closures: [],
    });
  }

  const user = getUserResponse.value;
  const userFavHCIds = user.favourites.map((fav) => fav.hawkerCentreId);

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.isErr) return getAllClosuresResponse;
  const closuresAll = getAllClosuresResponse.value;

  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllHCResponse.isErr) return getAllHCResponse;
  const hawkerCentres = getAllHCResponse.value;

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
      /* istanbul ignore next */
      if (!hawkerCentre) {
        throw new Error(
          `Missing hawker centre entry for hawkerCentreId ${favHCId}`,
        );
      }
      return hawkerCentre;
    }

    return nextOccurringClosure;
  });

  return Result.Ok({
    closures: userFavsWithClosures,
  });
}

/**
 * Returns the `isInFavouritesMode` value of the associated user.
 */
export async function isUserInFavouritesMode(
  telegramUser: TelegramUser,
): Promise<ResultType<IsUserInFavModeResponse, Error>> {
  const { id: userId } = telegramUser;

  const getUserResponse = await getUserById(userId);

  if (getUserResponse.isErr) {
    // user does not exist in DB
    return getUserResponse;
  }

  const user = getUserResponse.value;
  return Result.Ok({
    isInFavouritesMode: user.isInFavouritesMode,
  });
}

/**
 * Toggles the `isInFavouritesMode` value of the associated user.
 */
export async function toggleUserInFavouritesMode(
  telegramUser: TelegramUser,
  isInFavouritesMode: boolean,
): Promise<ResultType<void, Error>> {
  const { id: userId, username } = telegramUser;

  // TODO: potentially improve this flow
  const getUserResponse = await getUserById(userId);
  if (getUserResponse.isErr) {
    // user does not exist yet in DB
    const newUser = User.create({
      userId,
      username,
      languageCode: 'en',
      favourites: [],
      isInFavouritesMode,
      notifications: true,
    });

    const addUserResponse = await addUser(newUser);
    if (addUserResponse.isErr) return addUserResponse;
  } else {
    const updateUserResponse = await updateUserInFavouritesMode(
      userId,
      isInFavouritesMode,
    );
    if (updateUserResponse.isErr) return updateUserResponse;
  }

  return Result.Ok();
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

    if (getUserResponse.isOk) {
      currentValue = getUserResponse.value.notifications;
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
    if (getUserResponse.isErr) {
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

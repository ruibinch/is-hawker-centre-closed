/* eslint-disable max-len */
import { formatISO } from 'date-fns';

import { Result, type ResultType } from '../../../lib/Result';
import { getAllClosures } from '../../../models/Closure';
import {
  getAllHawkerCentres,
  getHawkerCentreByName,
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
import type { TelegramUser } from '../../../telegram';
import { notEmpty } from '../../../utils';
import { currentDate } from '../../../utils/date';
import { getNextOccurringClosure } from '../helpers';
import { filterByKeyword } from '../search';
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
    hawkerCentre: { name: hawkerCentreName },
    telegramUser: { id: userId, username },
  } = props;

  const addFavHC: UserFavourite = {
    hawkerCentreName,
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
  const userFavourites = user.favourites.map((fav) => fav.hawkerCentreName);

  // Check if hawker centre already exists in the favourites list
  if (userFavourites.includes(addFavHC.hawkerCentreName)) {
    return Result.Ok({
      isDuplicate: true,
    });
  }

  // Save list in ascending order of hawkerCentreId
  const favouritesUpdated = [...user.favourites, addFavHC].sort((a, b) =>
    a.hawkerCentreName.localeCompare(b.hawkerCentreName),
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
  const delHawkerCentreName = user.favourites[deleteIdx].hawkerCentreName;
  const getHCByNameResponse = await getHawkerCentreByName(delHawkerCentreName);
  if (getHCByNameResponse.isErr) return getHCByNameResponse;

  const delHawkerCentre = getHCByNameResponse.value;

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
  const userFavHCNames = user.favourites.map((fav) => fav.hawkerCentreName);

  const getAllClosuresResponse = await getAllClosures();
  if (getAllClosuresResponse.isErr) return getAllClosuresResponse;
  const closuresAll = getAllClosuresResponse.value;

  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllHCResponse.isErr) return getAllHCResponse;
  const hawkerCentres = getAllHCResponse.value;

  const userFavsWithClosures = userFavHCNames
    .map((favHCName) => {
      const closuresForHawkerCentre = closuresAll.filter(
        (closure) => closure.name === favHCName,
      );

      const nextOccurringClosure = getNextOccurringClosure(
        closuresForHawkerCentre,
      );

      // if there is no next occurring closure, fallback to returning the basic info
      if (!nextOccurringClosure) {
        // this can be potentially undefined, if a previously favourited hawker centre no longer exists now
        // the undefined values will be removed in the filter operation below
        return hawkerCentres.find((hc) => hc.name === favHCName);
      }

      return nextOccurringClosure;
    })
    .filter(notEmpty);

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

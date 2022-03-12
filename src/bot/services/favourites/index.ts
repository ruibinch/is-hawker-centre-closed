import { Result } from '../../../lib/Result';
import type { HawkerCentre } from '../../../models/HawkerCentre';
import type { ServiceResponse } from '../../../utils/types';
import { isCommand } from '../../commands';
import type { TelegramUser } from '../../telegram';
import { makeHawkerCentreName } from '../message';
import {
  addHCToFavourites,
  deleteHCFromFavourites,
  findHCByKeyword,
  getUserFavouritesWithClosures,
  isUserInFavouritesMode,
  manageNotifications,
  toggleUserInFavouritesMode,
} from './logic';
import {
  makeDuplicateHCErrorMessage,
  makeAddHCMessage,
  makeSuccessfullyAddedMessage,
  makeFavouritesListMessage,
  makeSuccessfullyDeletedMessage,
  makeDeleteErrorMessage,
  makeWriteNotificationsSettingMessage,
  makeReadNotificationsSettingMessage,
  makeDeleteUnexpectedErrorMessage,
  makeAddUnexpectedErrorMessage,
  makeListUnexpectedErrorMessage,
} from './message';

export * from './logic';
export * from './message';

export async function manageFavourites(
  text: string,
  telegramUser: TelegramUser,
): Promise<ServiceResponse> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav': {
      const findHCResponse = await findHCByKeyword(keyword);
      if (findHCResponse.isErr) {
        return Result.Ok({
          message: makeAddUnexpectedErrorMessage(),
        });
      }

      const { isExactMatch, isFindError, hawkerCentres } = findHCResponse.value;

      if (isExactMatch) {
        return executeAddHCToFavourites({
          hawkerCentre: hawkerCentres[0],
          telegramUser,
        });
      }

      let choices: string[] | undefined;
      if (!isFindError) {
        choices = hawkerCentres.map((hc) =>
          makeHawkerCentreName(hc.name, hc.nameSecondary, false),
        );

        // only toggle fav mode when user is presented with the choices screen
        const toggleUserInFavModeResponse = await toggleUserInFavouritesMode(
          telegramUser,
          true,
        );
        if (toggleUserInFavModeResponse.isErr) {
          return Result.Ok({
            message: makeAddUnexpectedErrorMessage(),
          });
        }
      }

      return Result.Ok({
        message: makeAddHCMessage({ keyword, hawkerCentres }),
        choices,
      });
    }
    case '/del': {
      const deleteHCResponse = await deleteHCFromFavourites({
        deleteIdx: Number(keyword) - 1,
        telegramUser,
      });

      if (deleteHCResponse.isErr) {
        return Result.Ok({
          message:
            'numFavourites' in deleteHCResponse.value
              ? makeDeleteErrorMessage(deleteHCResponse.value.numFavourites)
              : makeDeleteUnexpectedErrorMessage(),
        });
      }

      return Result.Ok({
        message: makeSuccessfullyDeletedMessage(
          deleteHCResponse.value.hawkerCentre,
        ),
      });
    }
    case '/list': {
      const getFavResponseWithClosures = await getUserFavouritesWithClosures(
        telegramUser,
      );
      if (getFavResponseWithClosures.isErr)
        return Result.Ok({
          message: makeListUnexpectedErrorMessage(),
        });

      return Result.Ok({
        message: makeFavouritesListMessage(
          getFavResponseWithClosures.value.closures,
        ),
      });
    }
    case '/notify': {
      const manageNotificationsResponse = await manageNotifications({
        keyword,
        telegramUser,
      });

      if (manageNotificationsResponse.operation === 'read') {
        return Result.Ok({
          message: makeReadNotificationsSettingMessage(
            manageNotificationsResponse.currentValue,
          ),
        });
      }

      return Result.Ok({
        message: makeWriteNotificationsSettingMessage(
          manageNotificationsResponse.newValue,
        ),
      });
    }
    /* istanbul ignore next */
    default:
      return Result.Err();
  }
}

/**
 * Checks if the user is in favourites mode and executes handleFavouriteSelection flow if so.
 */
export async function maybeHandleFavouriteSelection(
  text: string,
  telegramUser: TelegramUser,
): Promise<ServiceResponse> {
  const isUserInFavouritesModeResponse = await isUserInFavouritesMode(
    telegramUser,
  );

  if (
    isUserInFavouritesModeResponse.isErr ||
    !isUserInFavouritesModeResponse.value.isInFavouritesMode
  ) {
    return Result.Err();
  }

  return handleFavouriteSelection(text, telegramUser);
}

/**
 * Handles the flow when a user is in favourites mode.
 *
 * If the keyword is a command or  not an exact match of any hawker centre name, then fallback to normal handling.
 * e.g. if user is presented with the choices keyboard but opts to ignore it in favour of a normal keyword search
 */
async function handleFavouriteSelection(
  keyword: string,
  telegramUser: TelegramUser,
): Promise<ServiceResponse> {
  // set isInFavouritesMode back to false upon handling
  const toggleUserResponse = await toggleUserInFavouritesMode(
    telegramUser,
    false,
  );
  if (toggleUserResponse.isErr) return Result.Err();

  if (isCommand(keyword)) return Result.Err();

  const findHCResponse = await findHCByKeyword(keyword);
  if (findHCResponse.isErr) return Result.Err();

  const { isExactMatch, hawkerCentres } = findHCResponse.value;

  if (isExactMatch) {
    return executeAddHCToFavourites({
      hawkerCentre: hawkerCentres[0],
      telegramUser,
    });
  }

  return Result.Err();
}

/**
 * Wrapper function to handle the process of adding a hawker centre to the favourites list
 * and returning the correct message.
 */
async function executeAddHCToFavourites(props: {
  hawkerCentre: HawkerCentre;
  telegramUser: TelegramUser;
}): Promise<ServiceResponse> {
  const { hawkerCentre, telegramUser } = props;

  const addHCResponse = await addHCToFavourites({
    hawkerCentre,
    telegramUser,
  });
  if (addHCResponse.isErr)
    return Result.Ok({
      message: makeAddUnexpectedErrorMessage(),
    });

  const { isDuplicate } = addHCResponse.value;

  return Result.Ok({
    message: isDuplicate
      ? makeDuplicateHCErrorMessage(hawkerCentre)
      : makeSuccessfullyAddedMessage(hawkerCentre),
  });
}

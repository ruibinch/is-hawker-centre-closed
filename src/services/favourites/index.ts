import { isCommand } from '../../bot/commands';
import { HawkerCentre } from '../../models/types';
import { makeGenericErrorMessage } from '../../utils/message';
import { TelegramUser } from '../../utils/telegram';
import { ServiceResponse } from '../../utils/types';
import {
  addHCToFavourites,
  deleteHCFromFavourites,
  findHCByKeyword,
  getUserFavouritesWithResults,
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
} from './message';
import { HandleFavouriteSelectionResponse } from './types';

export * from './logic';
export * from './message';

export async function manageFavourites(
  text: string,
  telegramUser: TelegramUser,
): ServiceResponse {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav': {
      const findHCResponse = await findHCByKeyword(keyword);
      if (!findHCResponse.success) return null;

      const { isExactMatch, isFindError, hawkerCentres } = findHCResponse;

      if (isExactMatch) {
        return executeAddHCToFavourites({
          hawkerCentre: hawkerCentres[0],
          telegramUser,
        });
      }

      let choices: string[] | undefined;
      if (!isFindError) {
        choices = hawkerCentres.map((hc) => hc.name);
        // only toggle fav mode when user is presented with the choices screen
        await toggleUserInFavouritesMode(telegramUser, true);
      }

      return {
        message: makeAddHCMessage({ keyword, hawkerCentres }),
        choices,
      };
    }
    case '/del': {
      const deleteHCResponse = await deleteHCFromFavourites({
        deleteIdx: Number(keyword) - 1,
        telegramUser,
      });
      if (!deleteHCResponse.success && deleteHCResponse.isError) return null;

      if (deleteHCResponse.success) {
        return {
          message: makeSuccessfullyDeletedMessage(
            deleteHCResponse.hawkerCentre,
          ),
        };
      }

      return {
        message: makeDeleteErrorMessage(deleteHCResponse.numFavourites),
      };
    }
    case '/list': {
      const getFavResponseWithResults = await getUserFavouritesWithResults(
        telegramUser,
      );
      if (!getFavResponseWithResults.success) return null;

      return {
        message: makeFavouritesListMessage(getFavResponseWithResults.results),
      };
    }
    case '/notify': {
      const manageNotificationsResponse = await manageNotifications({
        keyword,
        telegramUser,
      });

      if (manageNotificationsResponse.operation === 'read') {
        return {
          message: makeReadNotificationsSettingMessage(
            manageNotificationsResponse.currentValue,
          ),
        };
      }

      return {
        message: makeWriteNotificationsSettingMessage(
          manageNotificationsResponse.newValue,
        ),
      };
    }
    /* istanbul ignore next */
    default:
      return null;
  }
}

/**
 * Checks if the user is in favourites mode and executes handleFavouriteSelection flow if so.
 */
export async function maybeHandleFavouriteSelection(
  text: string,
  telegramUser: TelegramUser,
): Promise<HandleFavouriteSelectionResponse> {
  const isUserInFavouritesModeResponse = await isUserInFavouritesMode(
    telegramUser,
  );

  if (
    !isUserInFavouritesModeResponse.success ||
    !isUserInFavouritesModeResponse.isInFavouritesMode
  ) {
    return { success: false };
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
): Promise<HandleFavouriteSelectionResponse> {
  // set isInFavouritesMode back to false upon handling
  await toggleUserInFavouritesMode(telegramUser, false);

  if (isCommand(keyword)) return { success: false };

  const findHCResponse = await findHCByKeyword(keyword);
  if (!findHCResponse.success) return { success: false };

  const { isExactMatch, hawkerCentres } = findHCResponse;

  if (isExactMatch) {
    const addHCToFavouritesResponse = await executeAddHCToFavourites({
      hawkerCentre: hawkerCentres[0],
      telegramUser,
    });

    if (addHCToFavouritesResponse === null) {
      return { success: false };
    }

    return {
      success: true,
      response: addHCToFavouritesResponse,
    };
  }

  return { success: false };
}

/**
 * Wrapper function to handle the process of adding a hawker centre to the favourites list
 * and returning the correct message.
 */
async function executeAddHCToFavourites(props: {
  hawkerCentre: HawkerCentre;
  telegramUser: TelegramUser;
}): ServiceResponse {
  const { hawkerCentre, telegramUser } = props;

  const addHCResponse = await addHCToFavourites({
    hawkerCentre,
    telegramUser,
  });
  if (addHCResponse === null) return null;

  const { success, isDuplicate } = addHCResponse;

  if (success) {
    return {
      message: makeSuccessfullyAddedMessage(hawkerCentre),
    };
  }

  if (isDuplicate) {
    return {
      message: makeDuplicateHCErrorMessage(hawkerCentre),
    };
  }

  // should never reach here
  /* istanbul ignore next */
  return {
    message: makeGenericErrorMessage(),
  };
}

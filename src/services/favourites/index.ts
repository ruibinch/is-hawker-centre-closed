import { Err, Ok, Result } from 'ts-results';

import { isCommand } from '../../bot/commands';
import { CustomError } from '../../errors/CustomError';
import { HawkerCentre } from '../../models/HawkerCentre';
import { TelegramUser } from '../../utils/telegram';
import { BotResponse, ServiceResponse } from '../../utils/types';
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
      if (findHCResponse.err) return findHCResponse;

      const { isExactMatch, isFindError, hawkerCentres } = findHCResponse.val;

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
        await toggleUserInFavouritesMode(telegramUser, true);
      }

      return Ok({
        message: makeAddHCMessage({ keyword, hawkerCentres }),
        choices,
      });
    }
    case '/del': {
      const deleteHCResponse = await deleteHCFromFavourites({
        deleteIdx: Number(keyword) - 1,
        telegramUser,
      });

      if (deleteHCResponse.err) {
        if (deleteHCResponse.val instanceof CustomError)
          return Err(deleteHCResponse.val);

        return Ok({
          message: makeDeleteErrorMessage(deleteHCResponse.val.numFavourites),
        });
      }

      return Ok({
        message: makeSuccessfullyDeletedMessage(
          deleteHCResponse.val.hawkerCentre,
        ),
      });
    }
    case '/list': {
      const getFavResponseWithClosures = await getUserFavouritesWithClosures(
        telegramUser,
      );
      if (getFavResponseWithClosures.err) return getFavResponseWithClosures;

      return Ok({
        message: makeFavouritesListMessage(
          getFavResponseWithClosures.val.closures,
        ),
      });
    }
    case '/notify': {
      const manageNotificationsResponse = await manageNotifications({
        keyword,
        telegramUser,
      });

      if (manageNotificationsResponse.operation === 'read') {
        return Ok({
          message: makeReadNotificationsSettingMessage(
            manageNotificationsResponse.currentValue,
          ),
        });
      }

      return Ok({
        message: makeWriteNotificationsSettingMessage(
          manageNotificationsResponse.newValue,
        ),
      });
    }
    /* istanbul ignore next */
    default:
      return Err.EMPTY;
  }
}

/**
 * Checks if the user is in favourites mode and executes handleFavouriteSelection flow if so.
 */
export async function maybeHandleFavouriteSelection(
  text: string,
  telegramUser: TelegramUser,
): Promise<Result<BotResponse, CustomError | void>> {
  const isUserInFavouritesModeResponse = await isUserInFavouritesMode(
    telegramUser,
  );

  if (isUserInFavouritesModeResponse.err) {
    return isUserInFavouritesModeResponse;
  }
  if (!isUserInFavouritesModeResponse.val.isInFavouritesMode) {
    return Err.EMPTY;
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
): Promise<Result<BotResponse, CustomError | void>> {
  // set isInFavouritesMode back to false upon handling
  await toggleUserInFavouritesMode(telegramUser, false);

  if (isCommand(keyword)) return Err.EMPTY;

  const findHCResponse = await findHCByKeyword(keyword);
  if (findHCResponse.err) return findHCResponse;

  const { isExactMatch, hawkerCentres } = findHCResponse.val;

  if (isExactMatch) {
    const addHCToFavouritesResponse = await executeAddHCToFavourites({
      hawkerCentre: hawkerCentres[0],
      telegramUser,
    });

    if (addHCToFavouritesResponse.err) {
      return Err.EMPTY;
    }

    return Ok(addHCToFavouritesResponse.val);
  }

  return Err.EMPTY;
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
  if (addHCResponse.err) return addHCResponse;

  const { isDuplicate } = addHCResponse.val;

  return Ok({
    message: isDuplicate
      ? makeDuplicateHCErrorMessage(hawkerCentre)
      : makeSuccessfullyAddedMessage(hawkerCentre),
  });
}

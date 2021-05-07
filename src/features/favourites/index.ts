import { makeGenericErrorMessage } from '../../common/message';
import { TelegramUser } from '../../common/telegram';
import { BotResponse } from '../../common/types';
import {
  addHCToFavourites,
  deleteHCFromFavourites,
  findHCByKeyword,
  getUserFavouritesWithResults,
} from './logic';
import {
  makeDuplicateHCErrorMessage,
  makeAddHCMessage,
  makeSuccessfullyAddedMessage,
  makeFavouritesListMessage,
  makeSuccessfullyDeletedMessage,
  makeDeleteErrorMessage,
} from './message';

export * from './logic';
export * from './message';

export async function manageFavourites(
  text: string,
  telegramUser: TelegramUser,
): Promise<BotResponse | null> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav': {
      const findHCResponse = await findHCByKeyword(keyword);
      if (findHCResponse === null) return null;

      const { isExactMatch, isFindError, hawkerCentres } = findHCResponse;

      if (isExactMatch) {
        return executeAddHCToFavourites({
          hawkerCentre: hawkerCentres[0],
          telegramUser,
        });
      }

      return {
        message: makeAddHCMessage({ keyword, hawkerCentres }),
        choices: isFindError
          ? undefined
          : // HACK: appending a /fav prefix so that this flow gets triggered again without maintaining session state
            hawkerCentres.map((hc) => `/fav ${hc.name}`),
      };
    }
    case '/del': {
      const deleteHCResponse = await deleteHCFromFavourites({
        deleteIdx: Number(keyword) - 1,
        telegramUser,
      });
      if (deleteHCResponse === null) return null;

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
      if (getFavResponseWithResults === null) return null;

      return {
        message: makeFavouritesListMessage(getFavResponseWithResults),
      };
    }
    /* istanbul ignore next */
    default:
      return null;
  }
}
/**
 * Wrapper function to handle the process of adding a hawker centre to the favourites list
 * and returning the correct message.
 */
async function executeAddHCToFavourites(props: {
  hawkerCentre: HawkerCentreInfo;
  telegramUser: TelegramUser;
}): Promise<BotResponse | null> {
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

import { makeGenericErrorMessage } from '../../common/message';
import { TelegramUser } from '../../common/telegram';
import { BotResponse } from '../../common/types';
import { addHCToFavourites, findHCByKeyword, getUserFavourites } from './logic';
import {
  makeDuplicateHCErrorMessage,
  makeAddHCMessage,
  makeSuccessfullyAddedMessage,
  makeFavouritesListMessage,
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
        const addHawkerCentre = hawkerCentres[0];

        const addHCResponse = await addHCToFavourites({
          hawkerCentre: addHawkerCentre,
          telegramUser,
        });
        if (addHCResponse === null) return null;

        const { success, isDuplicate } = addHCResponse;

        if (success) {
          return {
            message: makeSuccessfullyAddedMessage(hawkerCentres),
          };
        }

        if (isDuplicate) {
          return {
            message: makeDuplicateHCErrorMessage(addHawkerCentre),
          };
        }

        // should never reach here
        return {
          message: makeGenericErrorMessage(),
        };
      }

      return {
        message: makeAddHCMessage({ keyword, hawkerCentres }),
        choices: isFindError
          ? undefined
          : // HACK: appending a /fav prefix so that this flow gets triggered again without maintaining session state
            hawkerCentres.map((hc) => `/fav ${hc.name}`),
      };
    }
    case '/list': {
      const getFavResponse = await getUserFavourites(telegramUser);
      if (getFavResponse === null) return null;

      return {
        message: makeFavouritesListMessage(getFavResponse),
      };
    }
    default:
      return null;
  }
}

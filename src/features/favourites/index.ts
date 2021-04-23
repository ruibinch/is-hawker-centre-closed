import { makeGenericErrorMessage } from '../../common/message';
import { TelegramUser } from '../../common/telegram';
import { BotResponse } from '../../common/types';
import { addHCToFavourites, findHCByKeyword } from './logic';
import {
  makeDuplicateHCErrorMessage,
  makeMessage,
  makeSuccessfullyAddedMessage,
} from './message';

export * from './logic';
export * from './message';

export async function manageFavourites(
  text: string,
  user: TelegramUser,
): Promise<BotResponse | null> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav': {
      return findHCByKeyword(keyword).then((findHCResponse) => {
        if (findHCResponse === null) return null;

        const { isExactMatch, isFindError, hawkerCentres } = findHCResponse;

        if (isExactMatch) {
          const addHawkerCentre = hawkerCentres[0];

          return addHCToFavourites({
            hawkerCentre: addHawkerCentre,
            user,
          }).then((addHCResponse) => {
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
          });
        }

        return {
          message: makeMessage({ keyword, hawkerCentres }),
          choices: isFindError
            ? undefined
            : // HACK: appending a /fav prefix so that this flow gets triggered again without maintaining session state
              hawkerCentres.map((hc) => `/fav ${hc.name}`),
        };
      });
    }
    default:
      return null;
  }
}

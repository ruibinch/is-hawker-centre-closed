import { TelegramUser } from '../../common/telegram';
import { BotResponse } from '../../common/types';
import { findHCByKeyword } from './logic';
import { makeMessage, makeSuccessfullyAddedMessage } from './message';

export * from './logic';
export * from './message';

export async function manageFavourites(
  text: string,
  fromUser: TelegramUser,
): Promise<BotResponse | null> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav': {
      return findHCByKeyword(keyword).then((response) => {
        if (response === null) {
          return null;
        }

        const { isExactMatch, isFindError, hawkerCentres } = response;

        if (isExactMatch) {
          // TODO: add to favourites
          return {
            message: makeSuccessfullyAddedMessage(hawkerCentres),
          };
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

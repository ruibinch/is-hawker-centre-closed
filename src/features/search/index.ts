import { BotResponse } from '../../common/types';
import { processSearch } from './logic';
import { makeMessage } from './message';

export * from './logic';
export * from './message';
export * from './searchModifier';
export * from './types';

export async function runSearch(
  textSanitised: string,
): Promise<BotResponse | null> {
  return processSearch(textSanitised)
    .then((searchResponse) => {
      if (searchResponse === null) {
        return null;
      }

      return {
        message: makeMessage(searchResponse),
      };
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
}

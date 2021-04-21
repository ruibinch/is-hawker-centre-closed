import { processSearch } from './logic';
import { makeMessage } from './message';

export * from './logic';
export * from './message';
export * from './searchModifier';
export * from './types';

export async function runSearch(textSanitised: string): Promise<string | null> {
  return processSearch(textSanitised)
    .then((searchResponse) => {
      if (searchResponse === null) {
        return null;
      }

      const replyMessage = makeMessage(searchResponse);
      return replyMessage;
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
}

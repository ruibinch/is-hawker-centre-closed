import { processSearch } from '../../reader/search';
import { makeMessage } from './message';

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

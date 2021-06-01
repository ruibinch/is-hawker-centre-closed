import { ServiceResponse } from '../../utils/types';
import { processSearch } from './logic';
import { makeMessage } from './message';

export * from './logic';
export * from './message';
export * from './searchModifier';
export * from './types';

export async function runSearch(textSanitised: string): ServiceResponse {
  const searchResponse = await processSearch(textSanitised);
  if (searchResponse.err) return null;

  return {
    message: makeMessage(searchResponse.val),
  };
}

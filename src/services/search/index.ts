import { Err, Ok } from 'ts-results';

import { ServiceResponse } from '../../utils/types';
import { processSearch } from './logic';
import { makeMessage } from './message';

export * from './logic';
export * from './message';
export * from './searchModifier';
export * from './types';

export async function runSearch(
  textSanitised: string,
): Promise<ServiceResponse> {
  const searchResponse = await processSearch(textSanitised);
  if (searchResponse.err) return Err(searchResponse.val);

  return Ok({
    message: makeMessage(searchResponse.val),
  });
}

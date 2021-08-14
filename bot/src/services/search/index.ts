import { Result } from '../../../../lib/Result';
import { ServiceResponse } from '../../utils/types';
import { processSearch } from './logic';
import { makeMessage, makeSearchUnexpectedErrorMessage } from './message';

export * from './logic';
export * from './message';
export * from './searchModifier';
export * from './types';

export async function runSearch(
  textSanitised: string,
): Promise<ServiceResponse> {
  const searchResponse = await processSearch(textSanitised);
  if (searchResponse.isErr) {
    return Result.Ok({
      message: makeSearchUnexpectedErrorMessage(),
    });
  }

  return Result.Ok({
    message: makeMessage(searchResponse.value),
  });
}

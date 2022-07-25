import { Result } from '../../../lib/Result';
import {
  getInputsFromUserBetweenTimestamps,
  sortInputsByTime,
} from '../../../models/Input';
import { isCommand } from '../../commands';
import type { ServiceResponse } from '../../types';
import { isCallbackQuery } from '../helpers';
import { processSearch } from './logic';
import {
  makeSearchResponseMessage,
  makeSearchUnexpectedErrorMessage,
} from './message';

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
    // Fresh search hence current page is always 1
    messageParams: makeSearchResponseMessage(searchResponse.value, 1),
  });
}

export async function runSearchWithPagination({
  userId,
  originalMessageTimestamp,
  pageNum,
}: {
  userId: number;
  originalMessageTimestamp: number;
  pageNum: number;
}): Promise<ServiceResponse> {
  // originalMessage.date is displayed in Unix time seconds
  const originalMessageTimestampInMs = originalMessageTimestamp * 1000;
  // consider an input to be matching if it falls within a 2s range
  const MESSAGE_TIMESTAMP_THRESHOLD = 2000;

  const getInputsResponse = await getInputsFromUserBetweenTimestamps({
    userId,
    fromTimestamp: originalMessageTimestampInMs - MESSAGE_TIMESTAMP_THRESHOLD,
    toTimestamp: originalMessageTimestampInMs + MESSAGE_TIMESTAMP_THRESHOLD,
  });
  if (getInputsResponse.isErr) {
    return Result.Err();
  }

  const inputsRaw = getInputsResponse.value;
  // Filter non-search inputs
  const inputs = inputsRaw.filter(
    ({ text: inputText }) =>
      !isCommand(inputText) && !isCallbackQuery(inputText),
  );
  const inputsSorted = sortInputsByTime(inputs, 'desc');

  const originalInput = inputsSorted.length === 0 ? undefined : inputsSorted[0];
  if (!originalInput) {
    return Result.Err();
  }

  const originalSearchTerm = originalInput.text;
  const searchResponse = await processSearch(originalSearchTerm);
  if (searchResponse.isErr) {
    return Result.Err();
  }

  return Result.Ok({
    messageParams: makeSearchResponseMessage(searchResponse.value, pageNum),
  });
}

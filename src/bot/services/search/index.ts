import { Result } from '../../../lib/Result';
import { getAllInputs, sortInputsByTime } from '../../../models/Input';
import { isCommand } from '../../commands';
import type { ServiceResponse } from '../../types';
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
  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return Result.Err();
  }
  const inputsAll = getAllInputsResponse.value;

  const inputsSorted = sortInputsByTime(inputsAll, 'desc');
  // originalMessage.date is displayed in Unix time seconds
  const originalMessageTimestampInMs = originalMessageTimestamp * 1000;
  // consider an input to be matching if it falls within a 2s range
  const MESSAGE_TIMESTAMP_THRESHOLD = 2000;

  // Find the last search term by this user
  const originalInput = inputsSorted.find((input) => {
    const inputCreatedTimestampInMs = Number(input.inputId.split('-')[1]);

    return (
      input.userId === userId &&
      Math.abs(inputCreatedTimestampInMs - originalMessageTimestampInMs) <=
        MESSAGE_TIMESTAMP_THRESHOLD &&
      !isCommand(input.text)
    );
  });
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

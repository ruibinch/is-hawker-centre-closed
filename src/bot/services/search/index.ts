import { Result } from '../../../lib/Result';
import { getAllInputs } from '../../../models/Input';
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
  originalMessageDate,
  pageNum,
}: {
  userId: number;
  originalMessageDate: number;
  pageNum: number;
}): Promise<ServiceResponse> {
  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return Result.Err();
  }
  const inputsAll = getAllInputsResponse.value;

  // Find the last search term by this user
  const originalInput = inputsAll.find((input) => {
    // Divide by 1000 to remove milliseconds portion
    const inputCreatedDate = Math.floor(
      new Date(input.createdAt).getTime() / 1000,
    );

    return (
      input.userId === userId &&
      inputCreatedDate === originalMessageDate &&
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

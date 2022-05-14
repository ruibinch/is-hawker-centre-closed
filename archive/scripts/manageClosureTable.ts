import readline from 'readline';

import { generateHash } from '../dataCollection';
import { AWSError } from '../errors/AWSError';
// import { sendDiscordClosuresAdminMessage } from '../ext/discord';
import { Result } from '../lib/Result';
import {
  addClosure,
  type Closure,
  ClosureObject,
  deleteClosure,
  isValidClosureReason,
} from '../models/Closure';
import { getHawkerCentreById } from '../models/HawkerCentre';
import { prettifyJSON } from '../utils';
// import { getStage } from '../utils/stage';

const args = process.argv.slice(2);
const [operation, ...inputArgs] = args;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function makeErrorMessage(s: string) {
  return `ERROR: ${s}`;
}

function validateEntry(inputEntryString?: string) {
  // If inputEntryString is specified, then shouldSkipConfirmation should be set to true
  const entryProps = inputEntryString
    ? [...inputEntryString.split(' '), 'true']
    : inputArgs;

  if (entryProps.length !== 4 && entryProps.length !== 5) {
    // shouldSkipConfirmation argument is optional
    return Result.Err(
      `Incorrect number of arguments.\n\n` +
        `Input arguments should be:\n` +
        `{{hawkerCentreId}} {{reason}} {{startDate}} {{endDate}}`,
    );
  }

  const [hawkerCentreId, reason, startDate, endDate, shouldSkipConfirmation] =
    entryProps;

  // validate inputs
  if (!isValidClosureReason(reason)) {
    return Result.Err(`Invalid closure reason "${reason}"`);
  }
  const dateISO8601Regex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
  if (!dateISO8601Regex.test(startDate)) {
    return Result.Err(`Invalid start date "${startDate}`);
  }
  if (!dateISO8601Regex.test(endDate)) {
    return Result.Err(`Invalid end date "${endDate}`);
  }

  return Result.Ok({
    hawkerCentreId,
    reason,
    startDate,
    endDate,
    shouldSkipConfirmation,
  });
}

export async function addEntry(inputEntryString?: string): Promise<void> {
  const validateResult = validateEntry(inputEntryString);
  if (validateResult.isErr) {
    console.error(makeErrorMessage(validateResult.value));
    return;
  }
  const { hawkerCentreId, reason, startDate, endDate, shouldSkipConfirmation } =
    validateResult.value;

  const getHawkerCentreByIdResponse = await getHawkerCentreById(
    Number(hawkerCentreId),
  );
  if (getHawkerCentreByIdResponse.isErr) {
    console.error(
      makeErrorMessage('Invalid response from getHawkerCentreById'),
    );
    return;
  }
  const hawkerCentre = getHawkerCentreByIdResponse.value;

  const closureId = generateHash(hawkerCentreId, reason, startDate, endDate);
  const closureObject = ClosureObject.create({
    id: closureId,
    reason,
    startDate,
    endDate,
  });

  const closure: Closure = {
    ...hawkerCentre,
    ...closureObject,
  };

  const answer: string =
    shouldSkipConfirmation === 'true'
      ? 'y'
      : await new Promise((resolve) => {
          rl.question(
            `Confirm addition of this closure entry?\n${prettifyJSON(
              closure,
            )}\n\nAnswer (y/n): `,
            (_answer) => resolve(_answer),
          );
        });

  if (answer.toLowerCase() === 'y') {
    // skip sending message to admin channel when inputEntryString is undefined, i.e. DB fixing in progress
    await addClosure({
      closure,
      shouldSendMessage: inputEntryString === undefined,
    });
    // await sendDiscordClosuresAdminMessage(
    //   `[${getStage()}] ADDED CLOSURE ENTRY\n${Object.values(
    //     validateResult.value,
    //   ).join(' ')}`,
    // );
    console.info('Closure entry added');
  } else {
    console.info('Closure entry not added');
  }
}

export async function deleteEntry(inputEntryString?: string): Promise<void> {
  const validateResult = validateEntry(inputEntryString);
  if (validateResult.isErr) {
    console.error(makeErrorMessage(validateResult.value));
    return;
  }
  const { hawkerCentreId, reason, startDate, endDate } = validateResult.value;

  const closureId = generateHash(hawkerCentreId, reason, startDate, endDate);
  // skip sending message to admin channel when inputEntryString is undefined, i.e. DB fixing in progress
  const deleteClosureResult = await deleteClosure({
    closureId,
    hawkerCentreId: Number(hawkerCentreId),
    shouldSendMessage: inputEntryString === undefined,
  });
  if (deleteClosureResult.isErr) {
    const deleteClosureResultError = deleteClosureResult.value;
    console.error(
      makeErrorMessage(
        deleteClosureResultError instanceof AWSError
          ? 'Invalid response from getHawkerCentreById'
          : 'No closure entry found for the input arguments',
      ),
    );
    return;
  }

  // await sendDiscordClosuresAdminMessage(
  //   `[${getStage()}] DELETED CLOSURE ENTRY\n${Object.values(
  //     validateResult.value,
  //   ).join(' ')}`,
  // );
  console.info('Closure entry deleted');
}

export async function run(): Promise<void> {
  if (operation === 'add') {
    await addEntry();
  } else if (operation === 'delete') {
    await deleteEntry();
  } else {
    throw new Error(`unrecognised operation name "${operation}"`);
  }
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

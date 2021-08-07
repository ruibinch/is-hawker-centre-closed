import readline from 'readline';
import { Err, Ok } from 'ts-results';

import { generateHash } from '../dataCollection';
import { AWSError } from '../errors/AWSError';
import { sendDiscordClosuresAdminMessage } from '../ext/discord';
import {
  addClosure,
  Closure,
  ClosureObject,
  deleteClosure,
  isValidClosureReason,
} from '../models/Closure';
import { getHawkerCentreById } from '../models/HawkerCentre';
import { getStage, prettifyJSON } from '../utils';

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
    return Err(
      `Incorrect number of arguments.\n\n` +
        `Input arguments should be:\n` +
        `{{hawkerCentreId}} {{reason}} {{startDate}} {{endDate}}`,
    );
  }

  const [hawkerCentreId, reason, startDate, endDate, shouldSkipConfirmation] =
    entryProps;

  // validate inputs
  if (!isValidClosureReason(reason)) {
    return Err(`Invalid closure reason "${reason}"`);
  }
  const dateISO8601Regex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
  if (!dateISO8601Regex.test(startDate)) {
    return Err(`Invalid start date "${startDate}`);
  }
  if (!dateISO8601Regex.test(endDate)) {
    return Err(`Invalid end date "${endDate}`);
  }

  return Ok({
    hawkerCentreId,
    reason,
    startDate,
    endDate,
    shouldSkipConfirmation,
  });
}

export async function addEntry(inputEntryString?: string): Promise<void> {
  const validateResult = validateEntry(inputEntryString);
  if (validateResult.err) {
    console.error(makeErrorMessage(validateResult.val));
    return;
  }
  const { hawkerCentreId, reason, startDate, endDate, shouldSkipConfirmation } =
    validateResult.val;

  const getHawkerCentreByIdResponse = await getHawkerCentreById(
    Number(hawkerCentreId),
  );
  if (getHawkerCentreByIdResponse.err) {
    console.error(
      makeErrorMessage('Invalid response from getHawkerCentreById'),
    );
    return;
  }
  const hawkerCentre = getHawkerCentreByIdResponse.val;

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
    await addClosure(closure);
    await sendDiscordClosuresAdminMessage(
      `[${getStage()}] ADDED CLOSURE ENTRY\n${Object.values(
        validateResult.val,
      ).join(' ')}`,
    );
    console.info('Closure entry added');
  } else {
    console.info('Closure entry not added');
  }
}

export async function deleteEntry(inputEntryString?: string): Promise<void> {
  const validateResult = validateEntry(inputEntryString);
  if (validateResult.err) {
    console.error(makeErrorMessage(validateResult.val));
    return;
  }
  const { hawkerCentreId, reason, startDate, endDate } = validateResult.val;

  const closureId = generateHash(hawkerCentreId, reason, startDate, endDate);
  const deleteClosureResult = await deleteClosure(
    closureId,
    Number(hawkerCentreId),
  );
  if (deleteClosureResult.err) {
    const deleteClosureResultError = deleteClosureResult.val;
    console.error(
      makeErrorMessage(
        deleteClosureResultError instanceof AWSError
          ? 'Invalid response from getHawkerCentreById'
          : 'No closure entry found for the input arguments',
      ),
    );
    return;
  }

  await sendDiscordClosuresAdminMessage(
    `[${getStage()}] DELETED CLOSURE ENTRY\n${Object.values(
      validateResult.val,
    ).join(' ')}`,
  );
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

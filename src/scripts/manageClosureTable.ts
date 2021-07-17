import readline from 'readline';
import { Err, Ok } from 'ts-results';

import { generateHash } from '../dataCollection';
import {
  addClosure,
  Closure,
  ClosureObject,
  isValidClosureReason,
} from '../models/Closure';
import { getHawkerCentreById } from '../models/HawkerCentre';
import { prettifyJSON } from '../utils';

const args = process.argv.slice(2);
const [operation, ...inputArgs] = args;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function makeErrorMessage(s: string) {
  return `ERROR: ${s}`;
}

function validateInputArgs() {
  if (inputArgs.length !== 4) {
    return Err(
      `Incorrect number of arguments.\n\n` +
        `Input arguments should be:\n` +
        `{{hawkerCentreId}} {{reason}} {{startDate}} {{endDate}}`,
    );
  }
  const [hawkerCentreId, reason, startDate, endDate] = inputArgs;

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
  });
}

export async function addEntry(): Promise<void> {
  const validateResult = validateInputArgs();
  if (validateResult.err) {
    console.error(makeErrorMessage(validateResult.val));
    return;
  }

  const { hawkerCentreId, reason, startDate, endDate } = validateResult.val;

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

  const answer: string = await new Promise((resolve) => {
    rl.question(
      `Confirm addition of this closure entry?\n${prettifyJSON(
        closure,
      )}\n\nAnswer (y/n): `,
      (_answer) => resolve(_answer),
    );
  });

  if (answer.toLowerCase() === 'y') {
    await addClosure(closure);
    console.info('Closure entry added');
  } else {
    console.info('Closure entry not added');
  }
}

export async function run(): Promise<void> {
  if (operation === 'add') {
    await addEntry();
  } else {
    throw new Error(`unrecognised operation name "${operation}"`);
  }
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

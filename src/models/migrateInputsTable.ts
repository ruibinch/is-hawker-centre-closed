import * as AWS from 'aws-sdk';
import fs from 'fs';

import { initAWSConfig } from '../ext/aws/config';
import { DDB_PROPAGATE_DURATION } from '../ext/aws/dynamodb';
import { sleep } from '../utils';
import { getStage } from '../utils/stage';
import { addInputToDB, getAllInputs, Input } from './Input';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

async function getInputs() {
  const getAllInputsResult = await getAllInputs();
  if (getAllInputsResult.isErr) {
    throw getAllInputsResult.value;
  }

  // Note: unsafe to store inputs in RAM here but inputs table is small enough for this to be workable
  const inputs = getAllInputsResult.value;
  // save to file cause kiasu
  fs.writeFileSync(
    `./data/inputs-${getStage()}.json`,
    JSON.stringify(inputs, null, 4),
  );

  return inputs;
}

async function recreateInputsTable() {
  const deleteTableOutput = await dynamoDb
    .deleteTable({ TableName: Input.getTableName() })
    .promise();
  if (deleteTableOutput.$response.error) {
    throw deleteTableOutput.$response.error;
  }

  await sleep(DDB_PROPAGATE_DURATION);

  const createTableOutput = await dynamoDb
    .createTable(Input.getSchema())
    .promise();
  if (createTableOutput.$response.error) {
    throw createTableOutput.$response.error;
  }

  // wait for 16secs cause kiasu
  await sleep(DDB_PROPAGATE_DURATION * 4);
}

async function addCreatedAtTimestampColumn(inputs: Input[]) {
  return inputs.map((input) => {
    if (!('inputId' in input)) {
      return input;
    }

    return {
      ...input,
      // @ts-expect-error inputId is ascertained to exist here
      createdAtTimestamp: Number(input.inputId.split('-')[1]),
    };
  });
}

async function removeDeprecatedColumns(inputs: Input[]) {
  return inputs.map((input) => ({
    userId: input.userId,
    username: input.username,
    text: input.text,
    createdAtTimestamp: input.createdAtTimestamp,
  }));
}

async function uploadInputs(inputsNew: Input[]) {
  const addInputResults = await Promise.all(
    inputsNew.map((input) => addInputToDB(input)),
  );
  const { numSuccess, numFailure } = addInputResults.reduce(
    (_resultsCount: { numSuccess: number; numFailure: number }, result) => {
      if (result.isOk) {
        _resultsCount.numSuccess += 1;
      } else {
        _resultsCount.numFailure += 1;
      }
      return _resultsCount;
    },
    { numSuccess: 0, numFailure: 0 },
  );

  console.log(`Succeeded: ${numSuccess}`);
  console.log(`Failed: ${numFailure}`);
}

export async function run(): Promise<void> {
  const inputs = await getInputs();
  await recreateInputsTable();

  const inputsWithCreatedAtTimestamp = await addCreatedAtTimestampColumn(
    inputs,
  );
  const inputsLatest = await removeDeprecatedColumns(
    inputsWithCreatedAtTimestamp,
  );

  await uploadInputs(inputsLatest);
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

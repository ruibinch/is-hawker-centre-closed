import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import type { NEAData } from '../dataCollection';
import { DBError } from '../errors/DBError';
import { initAWSConfig } from '../ext/aws/config';
import { DDB_PROPAGATE_DURATION } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { getAllClosures, ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { getAllHawkerCentres, HawkerCentre } from '../models/HawkerCentre';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { notEmpty, wrapPromise, sleep, WrappedPromise } from '../utils';
import { getStage } from '../utils/stage';

const args = process.argv.slice(2);
const [operationArg] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

type DynamoDBOperationResult = {
  success: boolean;
  message: string | undefined;
};

function parseDynamoDBPromises(
  outputs: WrappedPromise<
    PromiseResult<
      AWS.DynamoDB.CreateTableOutput | AWS.DynamoDB.DeleteTableOutput,
      AWS.AWSError
    >
  >[],
): DynamoDBOperationResult[] {
  return outputs.map((output) => {
    if ('error' in output) {
      return {
        success: false,
        message: output.error.message,
      };
    }

    return {
      success: true,
      message: output.result.TableDescription?.TableName,
    };
  });
}

function makeListOutput(results: DynamoDBOperationResult[]) {
  const resultsDefined = results.filter(notEmpty);

  return resultsDefined.length === 0
    ? '-'
    : resultsDefined
        .map((result, idx) => `${idx + 1}. ${result.message}`)
        .join('\n');
}

async function createTables() {
  const createTableOutputs = await Promise.all(
    [
      dynamoDb.createTable(ClosureObject.getSchema()).promise(),
      dynamoDb.createTable(HawkerCentre.getSchema()).promise(),
      dynamoDb.createTable(User.getSchema()).promise(),
      dynamoDb.createTable(Feedback.getSchema()).promise(),
      dynamoDb.createTable(Input.getSchema()).promise(),
    ].map(wrapPromise),
  );

  const createTableOutputsParsed = parseDynamoDBPromises(createTableOutputs);
  const successOutputs = createTableOutputsParsed.filter(
    (result) => result.success,
  );
  const failureOutputs = createTableOutputsParsed.filter(
    (result) => !result.success,
  );

  await sendDiscordAdminMessage(
    `**[${getStage()}]  📢 DB TABLES CREATED**\n` +
      `${makeListOutput(successOutputs)}\n\n` +
      `Error creating the following tables:\n` +
      `${makeListOutput(failureOutputs)}`,
  );

  if (failureOutputs.length > 0) {
    throw new DBError(makeListOutput(failureOutputs));
  }
}

async function deleteTables() {
  const deleteTableOutputs = await Promise.all(
    [
      dynamoDb
        .deleteTable({ TableName: ClosureObject.getTableName() })
        .promise(),
      dynamoDb
        .deleteTable({ TableName: HawkerCentre.getTableName() })
        .promise(),
      dynamoDb.deleteTable({ TableName: User.getTableName() }).promise(),
      dynamoDb.deleteTable({ TableName: Feedback.getTableName() }).promise(),
      dynamoDb.deleteTable({ TableName: Input.getTableName() }).promise(),
    ].map(wrapPromise),
  );

  const deleteTableOutputsParsed = parseDynamoDBPromises(deleteTableOutputs);
  const successOutputs = deleteTableOutputsParsed.filter(
    (result) => result.success,
  );
  const failureOutputs = deleteTableOutputsParsed.filter(
    (result) => !result.success,
  );

  await sendDiscordAdminMessage(
    `**[${getStage()}]  📢 DB TABLES DELETED**\n` +
      `${makeListOutput(successOutputs)}\n\n` +
      `Error deleting the following tables:\n` +
      `${makeListOutput(failureOutputs)}`,
  );

  if (failureOutputs.length > 0) {
    throw new DBError(makeListOutput(failureOutputs));
  }
}

/**
 * Deletes and recreates the Closures and HawkerCentre tables.
 */
async function resetTables(): Promise<NEAData | null> {
  const getAllHCResponse = await getAllHawkerCentres();
  const getAllClosuresResponse = await getAllClosures();
  if (getAllHCResponse.isErr) {
    throw getAllHCResponse.value;
  }
  if (getAllClosuresResponse.isErr) {
    throw getAllClosuresResponse.value;
  }

  const numEntriesInClosuresTable = getAllClosuresResponse.value.length;
  const numEntriesInHCTable = getAllHCResponse.value.length;

  const deleteTableOutputs = await Promise.all(
    [
      dynamoDb
        .deleteTable({ TableName: ClosureObject.getTableName() })
        .promise(),
      dynamoDb
        .deleteTable({ TableName: HawkerCentre.getTableName() })
        .promise(),
    ].map(wrapPromise),
  );
  const deleteTableOutputsParsed = parseDynamoDBPromises(deleteTableOutputs);

  await sendDiscordAdminMessage(
    `**[${getStage()}]  📢 RESET IN PROGRESS\nDeleted tables:**\n${[
      [deleteTableOutputsParsed[0].message, numEntriesInClosuresTable],
      [deleteTableOutputsParsed[1].message, numEntriesInHCTable],
    ]
      .map(
        ([tableName, numEntries], idx) =>
          `${idx + 1}. ${tableName} (${numEntries} entries)`,
      )
      .join('\n')}`,
  );

  await sleep(DDB_PROPAGATE_DURATION);

  const createTableOutputs = await Promise.all(
    [
      dynamoDb.createTable(ClosureObject.getSchema()).promise(),
      dynamoDb.createTable(HawkerCentre.getSchema()).promise(),
    ].map(wrapPromise),
  );
  const createTableOutputsParsed = parseDynamoDBPromises(createTableOutputs);
  const successOutputs = createTableOutputsParsed.filter(
    (result) => result.success,
  );
  const failureOutputs = createTableOutputsParsed.filter(
    (result) => !result.success,
  );
  await sendDiscordAdminMessage(
    `**[${getStage()}]  📢 RESET IN PROGRESS**\n` +
      `Created tables:\n` +
      `${makeListOutput(successOutputs)}\n\n` +
      `Error creating the following tables:\n` +
      `${makeListOutput(failureOutputs)}`,
  );

  if (failureOutputs.length > 0) {
    throw new DBError(makeListOutput(failureOutputs));
  }

  return {
    closures: getAllClosuresResponse.value,
    hawkerCentres: getAllHCResponse.value,
  };
}

export async function run(operationInput?: string): Promise<NEAData | null> {
  const operation = operationInput ?? operationArg;

  if (operation === 'create') {
    await createTables();
  } else if (operation === 'delete') {
    await deleteTables();
  } else if (operation === 'reset') {
    const resetResult = await resetTables();
    return resetResult;
  }

  throw new Error(`unrecognised operation name "${operation}"`);
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

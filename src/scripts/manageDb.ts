import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import { sendDiscordMessage } from '../ext/discord';
import { getAllClosures, ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { getAllHawkerCentres, HawkerCentre } from '../models/HawkerCentre';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { getStage, notEmpty, sleep } from '../utils';

const args = process.argv.slice(2);
const [operationArg] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

function makeTableNames(tableNames: (string | undefined)[]) {
  return tableNames
    .filter(notEmpty)
    .map((tableName, idx) => `${idx + 1}. ${tableName}`)
    .join('\n');
}

async function createTables() {
  const createTableOutputs = await Promise.all([
    dynamoDb.createTable(ClosureObject.getSchema()).promise(),
    dynamoDb.createTable(HawkerCentre.getSchema()).promise(),
    dynamoDb.createTable(User.getSchema()).promise(),
    dynamoDb.createTable(Feedback.getSchema()).promise(),
    dynamoDb.createTable(Input.getSchema()).promise(),
  ]);

  await sendDiscordMessage(
    `[${getStage()}] DB TABLES CREATED\n${makeTableNames(
      createTableOutputs.map((output) => output.TableDescription?.TableName),
    )}\n`,
  );
}

async function deleteTables() {
  const deleteTableOutputs = await Promise.all([
    dynamoDb.deleteTable({ TableName: ClosureObject.getTableName() }).promise(),
    dynamoDb.deleteTable({ TableName: HawkerCentre.getTableName() }).promise(),
    dynamoDb.deleteTable({ TableName: User.getTableName() }).promise(),
    dynamoDb.deleteTable({ TableName: Feedback.getTableName() }).promise(),
    dynamoDb.deleteTable({ TableName: Input.getTableName() }).promise(),
  ]);

  await sendDiscordMessage(
    `[${getStage()}] DB TABLES DELETED\n${makeTableNames(
      deleteTableOutputs.map((output) => output.TableDescription?.TableName),
    )}\n`,
  );
}

/**
 * Deletes and recreates the Closures and HawkerCentre tables.
 */
async function resetTables() {
  const getAllHCResponse = await getAllHawkerCentres();
  const getAllClosuresResponse = await getAllClosures();
  if (getAllHCResponse.err || getAllClosuresResponse.err) {
    return;
  }

  const numEntriesInClosuresTable = getAllClosuresResponse.val.length;
  const numEntriesInHCTable = getAllHCResponse.val.length;

  const closuresTableDeleteOutput = await dynamoDb
    .deleteTable({ TableName: ClosureObject.getTableName() })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({ TableName: HawkerCentre.getTableName() })
    .promise();
  await sendDiscordMessage(
    `[${getStage()}] RESET IN PROGRESS\nDeleted tables:\n${[
      [
        closuresTableDeleteOutput.TableDescription?.TableName,
        numEntriesInClosuresTable,
      ],
      [
        hawkerCentreTableDeleteOutput.TableDescription?.TableName,
        numEntriesInHCTable,
      ],
    ]
      .map(
        ([tableName, numEntries], idx) =>
          `${idx + 1}. ${tableName} (${numEntries} entries)`,
      )
      .join('\n')}\n`,
  );

  // sleep for 2 secs for deletion process to propagate else creation will throw an error
  await sleep(2000);

  const createTableOutputs = await Promise.all([
    dynamoDb.createTable(ClosureObject.getSchema()).promise(),
    dynamoDb.createTable(HawkerCentre.getSchema()).promise(),
  ]);

  await sendDiscordMessage(
    `[${getStage()}] RESET IN PROGRESS\nCreated tables:\n${makeTableNames(
      createTableOutputs.map((output) => output.TableDescription?.TableName),
    )}\n`,
  );
}

export async function run(operationInput?: string): Promise<void> {
  const operation = operationInput ?? operationArg;

  if (operation === 'create') {
    await createTables();
  } else if (operation === 'delete') {
    await deleteTables();
  } else if (operation === 'reset') {
    await resetTables();
  } else {
    throw new Error(`unrecognised operation name "${operation}"`);
  }
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

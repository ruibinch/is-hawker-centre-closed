import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import { sendDiscordMessage } from '../ext/discord';
import { getAllClosures, ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { getAllHawkerCentres, HawkerCentre } from '../models/HawkerCentre';
import { User } from '../models/User';
import { notEmpty, sleep } from '../utils';

const args = process.argv.slice(2);
const [operation] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

function makeTableNames(tableNames: (string | undefined)[]) {
  return tableNames
    .filter(notEmpty)
    .map((tableName, idx) => `${idx + 1}. ${tableName}`)
    .join('\n');
}

async function createTables() {
  const closuresTableCreateOutput = await dynamoDb
    .createTable(ClosureObject.getSchema())
    .promise();
  const hawkerCentreTableCreateOutput = await dynamoDb
    .createTable(HawkerCentre.getSchema())
    .promise();
  const userTableCreateOutput = await dynamoDb
    .createTable(User.getSchema())
    .promise();
  const feedbackTableCreateOutput = await dynamoDb
    .createTable(Feedback.getSchema())
    .promise();

  await sendDiscordMessage(
    `DB TABLES CREATED\n\n${makeTableNames([
      closuresTableCreateOutput.TableDescription?.TableName,
      hawkerCentreTableCreateOutput.TableDescription?.TableName,
      userTableCreateOutput.TableDescription?.TableName,
      feedbackTableCreateOutput.TableDescription?.TableName,
    ])}`,
  );
}

async function deleteTables() {
  const closuresTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: ClosureObject.getTableName(),
    })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: HawkerCentre.getTableName(),
    })
    .promise();
  const userTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: User.getTableName(),
    })
    .promise();
  const feedbackTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: Feedback.getTableName(),
    })
    .promise();

  await sendDiscordMessage(
    `DB TABLES DELETED\n\n${makeTableNames([
      closuresTableDeleteOutput.TableDescription?.TableName,
      hawkerCentreTableDeleteOutput.TableDescription?.TableName,
      userTableDeleteOutput.TableDescription?.TableName,
      feedbackTableDeleteOutput.TableDescription?.TableName,
    ])}`,
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
    .deleteTable({
      TableName: ClosureObject.getTableName(),
    })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: HawkerCentre.getTableName(),
    })
    .promise();
  await sendDiscordMessage(
    `RESET IN PROGRESS\n\nDeleted tables:\n${[
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
      .join('\n')}`,
  );

  // sleep for 2 secs for deletion process to propagate else creation will throw an error
  await sleep(2000);

  const closuresTableCreateOutput = await dynamoDb
    .createTable(ClosureObject.getSchema())
    .promise();
  const hawkerCentreTableCreateOutput = await dynamoDb
    .createTable(HawkerCentre.getSchema())
    .promise();
  await sendDiscordMessage(
    `RESET IN PROGRESS\n\nCreated tables:\n${makeTableNames([
      closuresTableCreateOutput.TableDescription?.TableName,
      hawkerCentreTableCreateOutput.TableDescription?.TableName,
    ])}`,
  );
}

async function run() {
  if (operation === 'create') {
    await createTables();
  } else if (operation === 'delete') {
    await deleteTables();
  } else if (operation === 'reset') {
    await resetTables();
  } else {
    throw new Error(`unrecognised operation name "${operation}"`);
  }

  process.exit(0);
}

run();

import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import {
  getAllClosures,
  makeClosureSchema,
  makeClosureTableName,
} from '../models/Closure';
import { makeFeedbackSchema, makeFeedbackTableName } from '../models/Feedback';
import {
  getAllHawkerCentres,
  makeHawkerCentreSchema,
  makeHawkerCentreTableName,
} from '../models/HawkerCentre';
import { makeUserSchema, makeUserTableName } from '../models/User';
import { getStage } from '../utils/types';

const args = process.argv.slice(2);
const [operation] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();
const stage = getStage();

async function createTables() {
  const closuresTableCreateOutput = await dynamoDb
    .createTable(makeClosureSchema(stage))
    .promise();
  const hawkerCentreTableCreateOutput = await dynamoDb
    .createTable(makeHawkerCentreSchema(stage))
    .promise();
  const userTableCreateOutput = await dynamoDb
    .createTable(makeUserSchema(stage))
    .promise();
  const feedbackTableCreateOutput = await dynamoDb
    .createTable(makeFeedbackSchema(stage))
    .promise();

  console.log(
    `Created tables:\n${makeTableNames([
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
      TableName: makeClosureTableName(stage),
    })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: makeHawkerCentreTableName(stage),
    })
    .promise();
  const userTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: makeUserTableName(stage),
    })
    .promise();
  const feedbackTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: makeFeedbackTableName(stage),
    })
    .promise();

  console.log(
    `Deleted tables:\n${makeTableNames([
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
  const numEntriesInHCTable = getAllClosuresResponse.val.length;

  const closuresTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: makeClosureTableName(stage),
    })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: makeHawkerCentreTableName(stage),
    })
    .promise();
  console.log(
    `Deleted tables:\n${[
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
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const closuresTableCreateOutput = await dynamoDb
    .createTable(makeClosureSchema(stage))
    .promise();
  const hawkerCentreTableCreateOutput = await dynamoDb
    .createTable(makeHawkerCentreSchema(stage))
    .promise();
  console.log(
    `Created tables:\n${makeTableNames([
      closuresTableCreateOutput.TableDescription?.TableName,
      hawkerCentreTableCreateOutput.TableDescription?.TableName,
    ])}`,
  );
}

function makeTableNames(tableNames: (string | undefined)[]) {
  return tableNames
    .filter((entry) => Boolean(entry))
    .map((tableName, idx) => `${idx + 1}. ${tableName}`)
    .join('\n');
}

console.log(`Selected AWS region: ${AWS.config.region}\n`);
if (operation === 'create') {
  createTables();
} else if (operation === 'delete') {
  deleteTables();
} else if (operation === 'reset') {
  resetTables();
} else {
  console.log(`Error: unrecognised operation name "${operation}"`);
}

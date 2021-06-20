import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import { getAllClosures, ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { getAllHawkerCentres, HawkerCentre } from '../models/HawkerCentre';
import { User } from '../models/User';

const args = process.argv.slice(2);
const [operation] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

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
      TableName: ClosureObject.getTableName(),
    })
    .promise();
  const hawkerCentreTableDeleteOutput = await dynamoDb
    .deleteTable({
      TableName: HawkerCentre.getTableName(),
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
    .createTable(ClosureObject.getSchema())
    .promise();
  const hawkerCentreTableCreateOutput = await dynamoDb
    .createTable(HawkerCentre.getSchema())
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

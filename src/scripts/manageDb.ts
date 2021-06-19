import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import { makeClosureSchema, makeClosureTableName } from '../models/Closure';
import { makeFeedbackSchema, makeFeedbackTableName } from '../models/Feedback';
import {
  makeHawkerCentreSchema,
  makeHawkerCentreTableName,
} from '../models/HawkerCentre';
import { makeUserSchema, makeUserTableName } from '../models/User';
import { Stage } from '../utils/types';

const args = process.argv.slice(2);
const [operation] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

async function createTables() {
  await Promise.all(
    ['dev', 'prod'].map(async (stageName) => {
      const stage = stageName as Stage;
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
        `Deleted tables:\n${makeTableNames([
          closuresTableCreateOutput.TableDescription?.TableName,
          hawkerCentreTableCreateOutput.TableDescription?.TableName,
          userTableCreateOutput.TableDescription?.TableName,
          feedbackTableCreateOutput.TableDescription?.TableName,
        ])}`,
      );
    }),
  );
}

async function deleteTables() {
  await Promise.all(
    ['dev', 'prod'].map(async (stageName) => {
      const stage = stageName as Stage;
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
    }),
  );
}

function makeTableNames(tableNames: (string | undefined)[]) {
  return tableNames
    .filter((entry) => Boolean(entry))
    .map((tableName, idx) => `${idx}. ${tableName}`)
    .join('\n');
}

console.log(`Selected AWS region: ${AWS.config.region}\n`);
if (operation === 'create') {
  createTables();
} else if (operation === 'delete') {
  deleteTables();
} else {
  console.log(`Error: unrecognised operation name "${operation}"`);
}

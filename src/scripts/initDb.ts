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
      console.log(
        `Created table "${closuresTableCreateOutput.TableDescription?.TableName}"`,
      );

      const hawkerCentreTableCreateOutput = await dynamoDb
        .createTable(makeHawkerCentreSchema(stage))
        .promise();
      console.log(
        `Created table "${hawkerCentreTableCreateOutput.TableDescription?.TableName}"`,
      );

      const userTableCreateOutput = await dynamoDb
        .createTable(makeUserSchema(stage))
        .promise();
      console.log(
        `Created table "${userTableCreateOutput.TableDescription?.TableName}"`,
      );

      const feedbackTableCreateOutput = await dynamoDb
        .createTable(makeFeedbackSchema(stage))
        .promise();
      console.log(
        `Created table "${feedbackTableCreateOutput.TableDescription?.TableName}"`,
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
      console.log(
        `Deleted table "${closuresTableDeleteOutput.TableDescription?.TableName}"`,
      );

      const hawkerCentreTableDeleteOutput = await dynamoDb
        .deleteTable({
          TableName: makeHawkerCentreTableName(stage),
        })
        .promise();
      console.log(
        `Deleted table "${hawkerCentreTableDeleteOutput.TableDescription?.TableName}"`,
      );

      const userTableDeleteOutput = await dynamoDb
        .deleteTable({
          TableName: makeUserTableName(stage),
        })
        .promise();
      console.log(
        `Deleted table "${userTableDeleteOutput.TableDescription?.TableName}"`,
      );

      const feedbackTableDeleteOutput = await dynamoDb
        .deleteTable({
          TableName: makeFeedbackTableName(stage),
        })
        .promise();
      console.log(
        `Deleted table "${feedbackTableDeleteOutput.TableDescription?.TableName}"`,
      );
    }),
  );
}

console.log(`Selected AWS region: ${AWS.config.region}\n`);
if (operation === 'create') {
  createTables();
} else if (operation === 'delete') {
  deleteTables();
} else {
  console.log(`Error: unrecognised operation name "${operation}"`);
}

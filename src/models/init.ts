import * as AWS from 'aws-sdk';

import { initAWSConfig } from '../aws/config';
import { Stage } from '../utils/types';
import { makeFeedbackSchema, makeFeedbackTableName } from './Feedback';
import {
  makeHawkerCentreSchema,
  makeHawkerCentreTableName,
} from './HawkerCentre';
import { makeResultsSchema, makeResultsTableName } from './Result';
import { makeUserSchema, makeUserTableName } from './User';

const args = process.argv.slice(2);
const [operation] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

async function createTables() {
  Promise.all(
    Object.values(Stage).map(async (stage) => {
      const resultsTableCreateOutput = await dynamoDb
        .createTable(makeResultsSchema(stage))
        .promise();
      console.log(
        `Created table "${resultsTableCreateOutput.TableDescription?.TableName}"`,
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
  Promise.all(
    Object.values(Stage).map(async (stage) => {
      const resultsTableDeleteOutput = await dynamoDb
        .deleteTable({
          TableName: makeResultsTableName(stage),
        })
        .promise();
      console.log(
        `Deleted table "${resultsTableDeleteOutput.TableDescription?.TableName}"`,
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

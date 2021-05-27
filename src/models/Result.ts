import * as AWS from 'aws-sdk';

import {
  initAWSConfig,
  TABLE_NAME_RESULTS,
  TABLE_RESULTS,
} from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { BaseResponse, getStage, Stage } from '../utils/types';
import { Result } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeResultsTableName = (stage: Stage): string =>
  `${TABLE_NAME_RESULTS}-${stage}`;

export const makeResultsSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeResultsTableName(stage),
  KeySchema: [
    {
      AttributeName: 'id',
      KeyType: 'HASH',
    },
    {
      AttributeName: 'hawkerCentreId',
      KeyType: 'RANGE',
    },
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'hawkerCentreId', AttributeType: 'N' },
  ],
});

export async function uploadResults(results: Result[]): Promise<void> {
  const resultsTable = makeResultsTableName(getStage());

  await Promise.all(
    results.map((result) => {
      const resultInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: resultsTable,
        Item: result,
        ConditionExpression: 'attribute_not_exists(id)',
      };
      return dynamoDb.put(resultInput).promise();
    }),
  );
}

export type GetAllResultsResponse = BaseResponse &
  (
    | {
        success: true;
        output: Result[];
      }
    | { success: false }
  );

export async function getAllResults(): Promise<GetAllResultsResponse> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_RESULTS,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (scanOutput === null) {
    return { success: false };
  }

  return {
    success: true,
    output: scanOutput.Items as Result[],
  };
}

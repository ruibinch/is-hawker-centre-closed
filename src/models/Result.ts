import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import {
  initAWSConfig,
  TABLE_NAME_RESULTS,
  TABLE_RESULTS,
} from '../aws/config';
import { getProvisionedThroughput } from '../aws/dynamodb';
import { getStage, Stage } from '../utils/types';
import { Result } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeResultsTableName = (stage: Stage): string =>
  `${TABLE_NAME_RESULTS}-${stage}`;

export const makeResultsSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
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
  ProvisionedThroughput: getProvisionedThroughput(),
});

export function uploadResults(results: Result[]): void {
  const resultsTable = makeResultsTableName(getStage());
  console.log(`Uploading to table "${resultsTable}"`);

  Promise.all(
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

export async function getAllResults(): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_RESULTS,
  };

  return dynamoDb.scan(params).promise();
}

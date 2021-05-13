import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { getProvisionedThroughput } from '../common/dynamodb';
import { Stage } from '../common/types';
import { TABLE_RESULTS } from '../common/variables';
import { Result } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeResultsTableName = (stage: Stage): string =>
  `ihcc-results-${stage}`;

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
  console.log(`Uploading to table "${TABLE_RESULTS}"`);
  Promise.all(
    results.map((result) => {
      const resultInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: TABLE_RESULTS,
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

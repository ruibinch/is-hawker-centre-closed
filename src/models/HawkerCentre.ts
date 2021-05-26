import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { initAWSConfig, TABLE_HC, TABLE_NAME_HC } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { getStage, Stage } from '../utils/types';
import { HawkerCentreInfo } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeHawkerCentreTableName = (stage: Stage): string =>
  `${TABLE_NAME_HC}-${stage}`;

export const makeHawkerCentreSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeHawkerCentreTableName(stage),
  KeySchema: [
    {
      AttributeName: 'hawkerCentreId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [
    { AttributeName: 'hawkerCentreId', AttributeType: 'N' },
  ],
});

export function uploadHawkerCentres(hawkerCentres: HawkerCentreInfo[]): void {
  const hcTable = makeHawkerCentreTableName(getStage());

  Promise.all(
    hawkerCentres.map((hawkerCentre) => {
      const hawkerCentreInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: hcTable,
        Item: hawkerCentre,
        ConditionExpression: 'attribute_not_exists(hawkerCentreId)',
      };
      return dynamoDb.put(hawkerCentreInput).promise();
    }),
  );
}

export async function getAllHawkerCentres(): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_HC,
  };

  return dynamoDb.scan(params).promise();
}

export async function getHawkerCentreById(
  hawkerCentreId: number,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.GetItemOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: TABLE_HC,
    Key: {
      hawkerCentreId,
    },
  };

  return dynamoDb.get(params).promise();
}

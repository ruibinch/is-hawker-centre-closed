import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { TABLE_HC } from '../common/variables';
import { HawkerCentreInfo } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export function uploadHawkerCentres(hawkerCentres: HawkerCentreInfo[]): void {
  console.log(`Uploading to table "${TABLE_HC}"`);
  Promise.all(
    hawkerCentres.map((hawkerCentre) => {
      const hawkerCentreInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: TABLE_HC,
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

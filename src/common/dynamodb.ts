import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { HawkerCentreInfo, Result } from './types';

const TABLE_RESULTS = 'ishawkercentreclosed';
const TABLE_HC = 'ihcc-hawkerCentres';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Results

export function uploadResults(results: Result[]): void {
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

// Hawker centres info

export function uploadHawkerCentres(hawkerCentres: HawkerCentreInfo[]): void {
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

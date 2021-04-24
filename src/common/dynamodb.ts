import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { HawkerCentreInfo, Result, User, UserFavourite } from './types';

const TABLE_RESULTS = 'ishawkercentreclosed';
const TABLE_HC = 'ihcc-hawkerCentres';
const TABLE_USERS = 'ihcc-users';
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

// Users

export async function addUser(
  user: User,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.PutItemOutput, AWS.AWSError>
> {
  const userInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: TABLE_USERS,
    Item: user,
    ConditionExpression: 'attribute_not_exists(userId)',
  };

  console.log(`Adding user: ${user.userId}`);
  return dynamoDb.put(userInput).promise();
}

export async function getUserById(
  userId: number,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.GetItemOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
  };

  return dynamoDb.get(params).promise();
}

export async function updateUser(
  userId: number,
  favouritesUpdated: UserFavourite[],
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.UpdateItemOutput, AWS.AWSError>
> {
  const updateUserInput: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
    UpdateExpression: 'set favourites = :fav',
    ExpressionAttributeValues: {
      ':fav': favouritesUpdated,
    },
  };

  console.log(`Updating user: ${userId}`);
  return dynamoDb.update(updateUserInput).promise();
}

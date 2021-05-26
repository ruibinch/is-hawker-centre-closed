import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { initAWSConfig, TABLE_NAME_USERS, TABLE_USERS } from '../aws/config';
import { getProvisionedThroughput } from '../aws/dynamodb';
import { Stage } from '../utils/types';
import { UserFavourite, User } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeUserTableName = (stage: Stage): string =>
  `${TABLE_NAME_USERS}-${stage}`;

export const makeUserSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  TableName: makeUserTableName(stage),
  KeySchema: [
    {
      AttributeName: 'userId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'N' }],
  ProvisionedThroughput: getProvisionedThroughput(),
});

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

  console.log(`Adding user ${user.userId} to "${TABLE_USERS}"`);
  return dynamoDb.put(userInput).promise();
}

export async function getAllUsers(): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_USERS,
  };

  return dynamoDb.scan(params).promise();
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

export async function updateUserFavourites(
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

  console.log(`Updating user ${userId} to "${TABLE_USERS}"`);
  return dynamoDb.update(updateUserInput).promise();
}

export async function updateUserInFavouritesMode(
  userId: number,
  isInFavouritesMode: boolean,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.UpdateItemOutput, AWS.AWSError>
> {
  const updateUserInput: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
    UpdateExpression: 'set isInFavouritesMode = :favMode',
    ExpressionAttributeValues: {
      ':favMode': isInFavouritesMode,
    },
  };

  return dynamoDb.update(updateUserInput).promise();
}

export async function updateUserNotifications(
  userId: number,
  notifications: boolean,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.UpdateItemOutput, AWS.AWSError>
> {
  const updateUserInput: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
    UpdateExpression: 'set notifications = :notif',
    ExpressionAttributeValues: {
      ':notif': notifications,
    },
  };

  return dynamoDb.update(updateUserInput).promise();
}

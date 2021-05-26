import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { formatISO } from 'date-fns';

import { initAWSConfig, TABLE_NAME_USERS, TABLE_USERS } from '../aws/config';
import { getProvisionedThroughput } from '../aws/dynamodb';
import { currentDate } from '../utils/date';
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
    Item: {
      ...user,
      createdAt: formatISO(currentDate()),
    },
    ConditionExpression: 'attribute_not_exists(userId)',
  };

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
    UpdateExpression: 'set favourites = :fav, lastUpdated = :timestamp',
    ExpressionAttributeValues: {
      ':fav': favouritesUpdated,
      ':timestamp': formatISO(currentDate()),
    },
  };

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
    UpdateExpression:
      'set isInFavouritesMode = :favMode, lastUpdated = :timestamp',
    ExpressionAttributeValues: {
      ':favMode': isInFavouritesMode,
      ':timestamp': formatISO(currentDate()),
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
    UpdateExpression: 'set notifications = :notif, lastUpdated = :timestamp',
    ExpressionAttributeValues: {
      ':notif': notifications,
      ':timestamp': formatISO(currentDate()),
    },
  };

  return dynamoDb.update(updateUserInput).promise();
}

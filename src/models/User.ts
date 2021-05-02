import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { TABLE_USERS } from '../common/variables';
import { UserFavourite, User } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

  console.log(`Updating user ${userId} to "${TABLE_USERS}"`);
  return dynamoDb.update(updateUserInput).promise();
}

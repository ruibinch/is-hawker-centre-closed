import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import { initAWSConfig, TABLE_NAME_USERS, TABLE_USERS } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { currentDate } from '../utils/date';
import { BaseResponse, Stage } from '../utils/types';
import { UserFavourite, User } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeUserTableName = (stage: Stage): string =>
  `${TABLE_NAME_USERS}-${stage}`;

export const makeUserSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeUserTableName(stage),
  KeySchema: [
    {
      AttributeName: 'userId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'N' }],
});

export async function addUser(user: User): Promise<BaseResponse> {
  const userInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: TABLE_USERS,
    Item: {
      ...user,
      createdAt: formatISO(currentDate()),
    },
    ConditionExpression: 'attribute_not_exists(userId)',
  };

  await dynamoDb.put(userInput).promise();
  return { success: true };
}

export type GetAllUsersResponse = BaseResponse &
  (
    | {
        success: true;
        output: User[];
      }
    | { success: false }
  );

export async function getAllUsers(): Promise<GetAllUsersResponse> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_USERS,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (scanOutput === null) {
    return { success: false };
  }

  return {
    success: true,
    output: scanOutput.Items as User[],
  };
}

export type GetUserByIdResponse = BaseResponse &
  (
    | {
        success: true;
        output: User;
      }
    | { success: false }
  );

export async function getUserById(
  userId: number,
): Promise<GetUserByIdResponse> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
  };

  const getResponse = await dynamoDb.get(params).promise();

  if (!getResponse.Item) {
    return { success: false };
  }

  return {
    success: true,
    output: getResponse.Item as User,
  };
}

export async function updateUserFavourites(
  userId: number,
  favouritesUpdated: UserFavourite[],
): Promise<BaseResponse> {
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

  await dynamoDb.update(updateUserInput).promise();
  return { success: true };
}

export async function updateUserInFavouritesMode(
  userId: number,
  isInFavouritesMode: boolean,
): Promise<BaseResponse> {
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

  await dynamoDb.update(updateUserInput).promise();
  return { success: true };
}

export async function updateUserNotifications(
  userId: number,
  notifications: boolean,
): Promise<BaseResponse> {
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

  await dynamoDb.update(updateUserInput).promise();
  return { success: true };
}

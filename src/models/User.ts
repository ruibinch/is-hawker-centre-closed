import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';
import NodeCache from 'node-cache';
import { Err, Ok, Result } from 'ts-results';

import { initAWSConfig, TABLE_NAME_USERS, TABLE_USERS } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { AWSError } from '../errors/AWSError';
import { Language } from '../lang';
import { currentDate } from '../utils/date';
import { Stage } from '../utils/types';
import { UserFavourite, User } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const userCache = new NodeCache({
  stdTTL: 30,
  useClones: false,
});

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

export async function addUser(user: User): Promise<void> {
  const userInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: TABLE_USERS,
    Item: {
      ...user,
      createdAt: formatISO(currentDate()),
    },
    ConditionExpression: 'attribute_not_exists(userId)',
  };

  await dynamoDb.put(userInput).promise();
}

export async function getAllUsers(): Promise<Result<User[], AWSError>> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_USERS,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (scanOutput === null) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as User[]);
}

export async function getUserById(
  userId: number,
): Promise<Result<User, AWSError>> {
  let user = userCache.get(userId);

  if (user === undefined) {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: TABLE_USERS,
      Key: {
        userId,
      },
    };

    const getResponse = await dynamoDb.get(params).promise();

    if (!getResponse.Item) {
      return Err(new AWSError());
    }

    user = getResponse.Item;
  }

  return Ok(user as User);
}

export async function updateUserFavourites(
  userId: number,
  favouritesUpdated: UserFavourite[],
): Promise<void> {
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
}

export async function updateUserInFavouritesMode(
  userId: number,
  isInFavouritesMode: boolean,
): Promise<void> {
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
}

export async function updateUserNotifications(
  userId: number,
  notifications: boolean,
): Promise<void> {
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
}

export async function updateUserLanguageCode(
  userId: number,
  languageCode: Language,
): Promise<void> {
  const updateUserInput: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: TABLE_USERS,
    Key: {
      userId,
    },
    UpdateExpression: 'set languageCode = :lang, lastUpdated = :timestamp',
    ExpressionAttributeValues: {
      ':lang': languageCode,
      ':timestamp': formatISO(currentDate()),
    },
  };

  await dynamoDb.update(updateUserInput).promise();
}

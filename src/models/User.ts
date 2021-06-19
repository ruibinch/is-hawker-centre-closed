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

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const userCache = new NodeCache({
  stdTTL: 30,
  useClones: false,
});

export type UserFavourite = {
  hawkerCentreId: number;
  dateAdded: string;
};

export type UserProps = {
  userId: number;
  username?: string;
  languageCode: Language;
  favourites: UserFavourite[];
  isInFavouritesMode: boolean;
  notifications: boolean;
};

export class User {
  userId: number;

  username?: string;

  languageCode: Language;

  favourites: UserFavourite[];

  isInFavouritesMode: boolean;

  notifications: boolean;

  private constructor(props: UserProps) {
    this.userId = props.userId;
    this.username = props.username;
    this.languageCode = props.languageCode;
    this.favourites = props.favourites;
    this.isInFavouritesMode = props.isInFavouritesMode;
    this.notifications = props.notifications;
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  static getTableName(stage: Stage): string {
    return `${TABLE_NAME_USERS}-${stage}`;
  }

  static getSchema(stage: Stage): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(stage),
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'N' }],
    };
  }
}

export async function addUser(user: User): Promise<void> {
  await dynamoDb
    .put({
      TableName: TABLE_USERS,
      Item: {
        ...user,
        createdAt: formatISO(currentDate()),
      },
      ConditionExpression: 'attribute_not_exists(userId)',
    })
    .promise();
}

export async function getAllUsers(): Promise<Result<User[], AWSError>> {
  const scanOutput = await dynamoDb
    .scan({
      TableName: TABLE_USERS,
    })
    .promise();

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
    const getResponse = await dynamoDb
      .get({
        TableName: TABLE_USERS,
        Key: {
          userId,
        },
      })
      .promise();

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
  await dynamoDb
    .update({
      TableName: TABLE_USERS,
      Key: {
        userId,
      },
      UpdateExpression: 'set favourites = :fav, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':fav': favouritesUpdated,
        ':timestamp': formatISO(currentDate()),
      },
    })
    .promise();
}

export async function updateUserInFavouritesMode(
  userId: number,
  isInFavouritesMode: boolean,
): Promise<void> {
  await dynamoDb
    .update({
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
    })
    .promise();
}

export async function updateUserNotifications(
  userId: number,
  notifications: boolean,
): Promise<void> {
  await dynamoDb
    .update({
      TableName: TABLE_USERS,
      Key: {
        userId,
      },
      UpdateExpression: 'set notifications = :notif, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':notif': notifications,
        ':timestamp': formatISO(currentDate()),
      },
    })
    .promise();
}

export async function updateUserLanguageCode(
  userId: number,
  languageCode: Language,
): Promise<void> {
  await dynamoDb
    .update({
      TableName: TABLE_USERS,
      Key: {
        userId,
      },
      UpdateExpression: 'set languageCode = :lang, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':lang': languageCode,
        ':timestamp': formatISO(currentDate()),
      },
    })
    .promise();
}

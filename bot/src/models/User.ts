import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';
import NodeCache from 'node-cache';

import { Result, type ResultType } from '../../../common/lib/Result';
import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_USERS } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import type { Language } from '../lang';
import { getStage, wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';

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
  username?: string | undefined;
  languageCode: Language;
  favourites: UserFavourite[];
  isInFavouritesMode: boolean;
  notifications: boolean;
};

export class User {
  userId: number;

  username?: string | undefined;

  languageCode: Language;

  favourites: UserFavourite[];

  isInFavouritesMode: boolean;

  notifications: boolean;

  createdAt: string;

  private constructor(props: UserProps) {
    this.userId = props.userId;
    this.username = props.username;
    this.languageCode = props.languageCode;
    this.favourites = props.favourites;
    this.isInFavouritesMode = props.isInFavouritesMode;
    this.notifications = props.notifications;
    this.createdAt = formatISO(currentDate());
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  static getTableName(): string {
    return `${TABLE_USERS}-${getStage()}`;
  }

  static getSchema(): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(),
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

export async function addUser(user: User): Promise<ResultType<void, Error>> {
  try {
    const putOutput = await dynamoDb
      .put({
        TableName: User.getTableName(),
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
      .promise();

    if (putOutput.$response.error) {
      return Result.Err(new AWSError());
    }

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getAllUsers(): Promise<ResultType<User[], Error>> {
  try {
    const scanOutput = await dynamoDb
      .scan({ TableName: User.getTableName() })
      .promise();

    if (!scanOutput.Items) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(scanOutput.Items as User[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getUserById(
  userId: number,
): Promise<ResultType<User, Error>> {
  let user = userCache.get(userId);

  if (user === undefined) {
    try {
      const getOutput = await dynamoDb
        .get({
          TableName: User.getTableName(),
          Key: { userId },
        })
        .promise();

      if (!getOutput.Item) {
        return Result.Err(new AWSError());
      }

      user = getOutput.Item;
    } catch (err) {
      return Result.Err(wrapUnknownError(err));
    }
  }

  return Result.Ok(user as User);
}

export async function updateUserFavourites(
  userId: number,
  favouritesUpdated: UserFavourite[],
): Promise<ResultType<void, Error>> {
  try {
    const updateOutput = await dynamoDb
      .update({
        TableName: User.getTableName(),
        Key: { userId },
        UpdateExpression: 'set favourites = :fav, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':fav': favouritesUpdated,
          ':timestamp': formatISO(currentDate()),
        },
      })
      .promise();

    if (updateOutput.$response.error) {
      return Result.Err(new AWSError());
    }

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function updateUserInFavouritesMode(
  userId: number,
  isInFavouritesMode: boolean,
): Promise<ResultType<void, Error>> {
  try {
    const updateOutput = await dynamoDb
      .update({
        TableName: User.getTableName(),
        Key: { userId },
        UpdateExpression:
          'set isInFavouritesMode = :favMode, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':favMode': isInFavouritesMode,
          ':timestamp': formatISO(currentDate()),
        },
      })
      .promise();

    if (updateOutput.$response.error) {
      return Result.Err(new AWSError());
    }

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function updateUserNotifications(
  userId: number,
  notifications: boolean,
): Promise<ResultType<void, Error>> {
  try {
    const updateOutput = await dynamoDb
      .update({
        TableName: User.getTableName(),
        Key: { userId },
        UpdateExpression:
          'set notifications = :notif, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':notif': notifications,
          ':timestamp': formatISO(currentDate()),
        },
      })
      .promise();

    if (updateOutput.$response.error) {
      return Result.Err(new AWSError());
    }

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function updateUserLanguageCode(
  userId: number,
  languageCode: Language,
): Promise<ResultType<void, Error>> {
  try {
    const updateOutput = await dynamoDb
      .update({
        TableName: User.getTableName(),
        Key: { userId },
        UpdateExpression: 'set languageCode = :lang, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':lang': languageCode,
          ':timestamp': formatISO(currentDate()),
        },
      })
      .promise();

    if (updateOutput.$response.error) {
      return Result.Err(new AWSError());
    }

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

import { CreateTableInput } from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { formatISO } from 'date-fns';
import NodeCache from 'node-cache';

import type { Language } from '../bot/lang';
import { AWSError } from '../errors/AWSError';
import { TABLE_USERS } from '../ext/aws/config';
import { ddbDocClient, getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { Result, type ResultType } from '../lib/Result';
import { wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';
import { getStage } from '../utils/stage';

const userCache = new NodeCache({
  stdTTL: 30,
  useClones: false,
});

export type UserFavourite = {
  hawkerCentreName: string;
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

  static getSchema(): CreateTableInput {
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
    console.info(`Adding user to DB: ${JSON.stringify(user)}`);
    const command = new PutCommand({
      TableName: User.getTableName(),
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    });
    ddbDocClient.send(command);

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getAllUsers(): Promise<ResultType<User[], Error>> {
  try {
    console.info(`Fetching all users from ${User.getTableName()}`);
    const command = new ScanCommand({ TableName: User.getTableName() });
    const scanOutput = await ddbDocClient.send(command);

    if (!scanOutput.Items) {
      throw new AWSError(
        `Missing items in scan output for table ${User.getTableName()}`,
      );
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
    console.info(`Fetching user from DB with userId=${userId}`);
    const command = new GetCommand({
      TableName: User.getTableName(),
      Key: { userId },
    });
    try {
      const getOutput = await ddbDocClient.send(command);

      if (!getOutput.Item) {
        throw new AWSError(`Missing item from get output for userId=${userId}`);
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
    console.info(
      `Updating favourites for userId=${userId} with ${favouritesUpdated.length} items`,
    );
    const command = new UpdateCommand({
      TableName: User.getTableName(),
      Key: { userId },
      UpdateExpression: 'set favourites = :fav, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':fav': favouritesUpdated,
        ':timestamp': formatISO(currentDate()),
      },
    });
    await ddbDocClient.send(command);

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
    console.info(
      `Updating isInFavouritesMode for userId=${userId} to ${isInFavouritesMode}`,
    );
    const command = new UpdateCommand({
      TableName: User.getTableName(),
      Key: { userId },
      UpdateExpression:
        'set isInFavouritesMode = :favMode, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':favMode': isInFavouritesMode,
        ':timestamp': formatISO(currentDate()),
      },
    });
    await ddbDocClient.send(command);

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
    console.info(
      `Updating notifications flag for userId=${userId} to ${notifications}`,
    );
    const command = new UpdateCommand({
      TableName: User.getTableName(),
      Key: { userId },
      UpdateExpression: 'set notifications = :notif, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':notif': notifications,
        ':timestamp': formatISO(currentDate()),
      },
    });
    await ddbDocClient.send(command);

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
    console.info(
      `Updating languageCode for userId=${userId} to ${languageCode}`,
    );
    const command = new UpdateCommand({
      TableName: User.getTableName(),
      Key: { userId },
      UpdateExpression: 'set languageCode = :lang, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':lang': languageCode,
        ':timestamp': formatISO(currentDate()),
      },
    });
    await ddbDocClient.send(command);

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

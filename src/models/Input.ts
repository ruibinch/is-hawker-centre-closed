import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_INPUTS } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { Result, type ResultType } from '../lib/Result';
import { wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';
import { getStage } from '../utils/stage';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

type InputProps = {
  inputId: string;
  userId: number;
  username?: string | undefined;
  text: string;
  createdAtTimestamp?: number;
};

export class Input {
  inputId: string;

  userId: number;

  username?: string | undefined;

  text: string;

  createdAt: string;

  createdAtTimestamp?: number | undefined;

  private constructor(props: InputProps) {
    this.inputId = props.inputId;
    this.userId = props.userId;
    this.username = props.username;
    this.text = props.text;
    this.createdAt = formatISO(currentDate());
    this.createdAtTimestamp = currentDate().getTime();
  }

  static create(props: InputProps): Input {
    return new Input(props);
  }

  static getTableName(): string {
    return `${TABLE_INPUTS}-${getStage()}`;
  }

  static getSchema(): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(),
      // composite primary key of userId + createdAtTimestamp
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'createdAtTimestamp',
          KeyType: 'RANGE',
        },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'N' },
        { AttributeName: 'createdAtTimestamp', AttributeType: 'N' },
      ],
    };
  }
}

type SortOrder = 'asc' | 'desc';

export function sortInputsByTime(inputs: Input[], order: SortOrder) {
  return [...inputs].sort((a, b) => {
    // inputId is of format `{{userId}}-{{unixTime}}`
    const aTime = Number(a.inputId.split('-')[1]);
    const bTime = Number(b.inputId.split('-')[1]);

    return order === 'asc' ? aTime - bTime : bTime - aTime;
  });
}

export async function getAllInputs(): Promise<ResultType<Input[], Error>> {
  try {
    const scanOutput = await dynamoDb
      .scan({ TableName: Input.getTableName() })
      .promise();

    if (!scanOutput.Items) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(scanOutput.Items as Input[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getInputsFromUserBetweenTimestamps({
  userId,
  fromTimestamp,
  toTimestamp,
}: {
  userId: number;
  fromTimestamp: number;
  toTimestamp: number;
}): Promise<ResultType<Input[], Error>> {
  try {
    const queryOutput = await dynamoDb
      // API ref: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
      .query({
        TableName: Input.getTableName(),
        ExpressionAttributeValues: {
          ':userId': userId,
          ':fromTs': fromTimestamp,
          ':toTs': toTimestamp,
        },
        KeyConditionExpression:
          // BETWEEN check is inclusive of the from/to bounds
          'userId = :userId AND createdAtTimestamp BETWEEN :fromTs AND :toTs',
      })
      .promise();

    if (queryOutput.$response.error || !queryOutput.Items) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(queryOutput.Items as Input[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function addInputToDB(
  input: Input,
): Promise<ResultType<void, Error>> {
  try {
    const putOutput = await dynamoDb
      .put({
        TableName: Input.getTableName(),
        Item: input,
        ConditionExpression: 'attribute_not_exists(inputId)',
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

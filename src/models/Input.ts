import * as AWS from 'aws-sdk';

import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_INPUTS } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { Result, type ResultType } from '../lib/Result';
import { wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';
import { getStage } from '../utils/stage';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

type InputProps = Omit<Input, 'createdAtTimestamp'>;

export class Input {
  userId: number;

  username?: string | undefined;

  text: string;

  createdAtTimestamp: number;

  private constructor(props: InputProps) {
    this.userId = props.userId;
    this.username = props.username;
    this.text = props.text;
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
    const aTime = a.createdAtTimestamp;
    const bTime = b.createdAtTimestamp;

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

export async function getInputsFromTimestamp(
  fromTimestamp: number,
): Promise<ResultType<Input[], Error>> {
  try {
    const getAllInputsResult = await getAllInputs();
    if (getAllInputsResult.isErr) return Result.Err(getAllInputsResult.value);

    const inputsAll = getAllInputsResult.value;
    const inputsFromTimestamp = inputsAll.filter(
      (input) => input.createdAtTimestamp >= fromTimestamp,
    );
    const inputsFromTimestampSorted = [...inputsFromTimestamp].sort(
      (a, b) => a.createdAtTimestamp - b.createdAtTimestamp,
    );
    return Result.Ok(inputsFromTimestampSorted);

    // TODO: restructure inputs table schema to allow for full querying by timestamp (e.g. using year as a key)

    // const queryOutput = await dynamoDb
    //   // API ref: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
    //   .query({
    //     TableName: Input.getTableName(),
    //     ExpressionAttributeValues: {
    //       ':fromTs': fromTimestamp,
    //     },
    //     KeyConditionExpression: 'createdAtTimestamp >= :fromTs',
    //   })
    //   .promise();

    // if (queryOutput.$response.error || !queryOutput.Items) {
    //   return Result.Err(new AWSError());
    // }

    // return Result.Ok(queryOutput.Items as Input[]);
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

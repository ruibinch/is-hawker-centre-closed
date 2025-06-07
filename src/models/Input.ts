import { CreateTableInput } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { AWSError } from '../errors/AWSError';
import { TABLE_INPUTS } from '../ext/aws/config';
import { ddbDocClient, getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { Result, type ResultType } from '../lib/Result';
import { prettifyJSON, wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';
import { getStage } from '../utils/stage';

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

  static getSchema(): CreateTableInput {
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
    console.info(`Fetching all inputs from table: ${Input.getTableName()}`);
    const command = new ScanCommand({ TableName: Input.getTableName() });
    const scanOutput = await ddbDocClient.send(command);

    if (!scanOutput.Items) {
      throw new AWSError('[getAllInputs] Missing items in scan output');
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
    console.info(
      `Fetching inputs for userId=${userId} between timestamps ${fromTimestamp} and ${toTimestamp}`,
    );
    // API ref=https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
    const command = new QueryCommand({
      TableName: Input.getTableName(),
      ExpressionAttributeValues: {
        ':userId': userId,
        ':fromTs': fromTimestamp,
        ':toTs': toTimestamp,
      },
      KeyConditionExpression:
        // BETWEEN check is inclusive of the from/to bounds
        'userId = :userId AND createdAtTimestamp BETWEEN :fromTs AND :toTs',
    });
    const queryOutput = await ddbDocClient.send(command);

    if (!queryOutput.Items) {
      throw new AWSError(
        `[getInputsFromUserBetweenTimestamps] Missing items in query output`,
      );
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
    return Result.Ok(inputsFromTimestamp);

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
    console.info(`Adding input to DB: ${prettifyJSON(input)}`);
    const command = new PutCommand({
      TableName: Input.getTableName(),
      Item: input,
    });
    await ddbDocClient.send(command);

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

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
};

export class Input {
  inputId: string;

  userId: number;

  username?: string | undefined;

  text: string;

  createdAt: string;

  private constructor(props: InputProps) {
    this.inputId = props.inputId;
    this.userId = props.userId;
    this.username = props.username;
    this.text = props.text;
    this.createdAt = formatISO(currentDate());
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
      KeySchema: [
        {
          AttributeName: 'inputId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [{ AttributeName: 'inputId', AttributeType: 'S' }],
    };
  }
}

export function sortInputsByTime(inputs: Input[], order: 'asc' | 'desc') {
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

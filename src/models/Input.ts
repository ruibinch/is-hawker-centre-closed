import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import { initAWSConfig, TABLE_INPUTS } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { getStage } from '../utils';
import { currentDate } from '../utils/date';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

type InputProps = {
  inputId: string;
  userId: number;
  username?: string;
  text: string;
};

export class Input {
  inputId: string;

  userId: number;

  username?: string;

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

export async function addInputToDB(input: Input): Promise<void> {
  await dynamoDb
    .put({
      TableName: Input.getTableName(),
      Item: input,
      ConditionExpression: 'attribute_not_exists(inputId)',
    })
    .promise();
}

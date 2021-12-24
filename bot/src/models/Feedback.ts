import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import { Result, type ResultType } from '../../../lib/Result';
import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_FEEDBACK } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { getStage, wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

type FeedbackProps = {
  feedbackId: string;
  userId: number;
  username?: string | undefined;
  text: string;
};

export class Feedback {
  feedbackId: string;

  userId: number;

  username?: string | undefined;

  text: string;

  createdAt: string;

  private constructor(props: FeedbackProps) {
    this.feedbackId = props.feedbackId;
    this.userId = props.userId;
    this.username = props.username;
    this.text = props.text;
    this.createdAt = formatISO(currentDate());
  }

  static create(props: FeedbackProps): Feedback {
    return new Feedback(props);
  }

  static getTableName(): string {
    return `${TABLE_FEEDBACK}-${getStage()}`;
  }

  static getSchema(): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(),
      KeySchema: [
        {
          AttributeName: 'feedbackId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        { AttributeName: 'feedbackId', AttributeType: 'S' },
      ],
    };
  }
}

export async function addFeedbackToDB(
  feedback: Feedback,
): Promise<ResultType<void, Error>> {
  try {
    const putOutput = await dynamoDb
      .put({
        TableName: Feedback.getTableName(),
        Item: feedback,
        ConditionExpression: 'attribute_not_exists(feedbackId)',
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

export async function getAllFeedback(): Promise<ResultType<Feedback[], Error>> {
  try {
    const scanOutput = await dynamoDb
      .scan({ TableName: Feedback.getTableName() })
      .promise();

    if (!scanOutput.Items) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(scanOutput.Items as Feedback[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

import { CreateTableInput } from '@aws-sdk/client-dynamodb';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { formatISO } from 'date-fns';

import { AWSError } from '../errors/AWSError';
import { TABLE_FEEDBACK } from '../ext/aws/config';
import { ddbDocClient, getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { Result, type ResultType } from '../lib/Result';
import { prettifyJSON, wrapUnknownError } from '../utils';
import { currentDate } from '../utils/date';
import { getStage } from '../utils/stage';

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

  static getSchema(): CreateTableInput {
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
    console.info(`Adding feedback to DB: ${prettifyJSON(feedback)}`);
    const command = new PutCommand({
      TableName: Feedback.getTableName(),
      Item: feedback,
      ConditionExpression: 'attribute_not_exists(feedbackId)',
    });
    await ddbDocClient.send(command);

    return Result.Ok();
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getAllFeedback(): Promise<ResultType<Feedback[], Error>> {
  try {
    console.info(`Fetching all feedback from ${Feedback.getTableName()}`);
    const command = new ScanCommand({ TableName: Feedback.getTableName() });
    const scanOutput = await ddbDocClient.send(command);

    if (!scanOutput.Items) {
      throw new AWSError('[getAllFeedback] Missing items in scan output');
    }

    return Result.Ok(scanOutput.Items as Feedback[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

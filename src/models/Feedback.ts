import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import { initAWSConfig, TABLE_FEEDBACK } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { getStage } from '../utils';
import { currentDate } from '../utils/date';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

type FeedbackProps = {
  feedbackId: string;
  userId: number;
  username?: string;
  text: string;
};

export class Feedback {
  feedbackId: string;

  userId: number;

  username?: string;

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

export async function addFeedbackToDB(feedback: Feedback): Promise<void> {
  await dynamoDb
    .put({
      TableName: Feedback.getTableName(),
      Item: feedback,
      ConditionExpression: 'attribute_not_exists(feedbackId)',
    })
    .promise();
}

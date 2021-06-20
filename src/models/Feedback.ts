import * as AWS from 'aws-sdk';
import { formatISO } from 'date-fns';

import {
  initAWSConfig,
  TABLE_FEEDBACK,
  TABLE_NAME_FEEDBACK,
} from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { currentDate } from '../utils/date';
import { Stage } from '../utils/types';

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

  private constructor(props: FeedbackProps) {
    this.feedbackId = props.feedbackId;
    this.userId = props.userId;
    this.username = props.username;
    this.text = props.text;
  }

  static getTableName(stage: Stage): string {
    return `${TABLE_NAME_FEEDBACK}-${stage}`;
  }

  static getSchema(stage: Stage): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(stage),
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
      TableName: TABLE_FEEDBACK,
      Item: {
        ...feedback,
        createdAt: formatISO(currentDate()),
      },
      ConditionExpression: 'attribute_not_exists(feedbackId)',
    })
    .promise();
}

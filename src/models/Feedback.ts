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
import { Feedback } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeFeedbackTableName = (stage: Stage): string =>
  `${TABLE_NAME_FEEDBACK}-${stage}`;

export const makeFeedbackSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeFeedbackTableName(stage),
  KeySchema: [
    {
      AttributeName: 'feedbackId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [{ AttributeName: 'feedbackId', AttributeType: 'S' }],
});

export async function addFeedbackToDB(feedback: Feedback): Promise<void> {
  const feedbackInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: TABLE_FEEDBACK,
    Item: {
      ...feedback,
      createdAt: formatISO(currentDate()),
    },
    ConditionExpression: 'attribute_not_exists(feedbackId)',
  };

  await dynamoDb.put(feedbackInput).promise();
}

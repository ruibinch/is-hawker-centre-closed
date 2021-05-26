import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { formatISO } from 'date-fns';

import {
  initAWSConfig,
  TABLE_FEEDBACK,
  TABLE_NAME_FEEDBACK,
} from '../aws/config';
import { getProvisionedThroughput } from '../aws/dynamodb';
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
  TableName: makeFeedbackTableName(stage),
  KeySchema: [
    {
      AttributeName: 'feedbackId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [{ AttributeName: 'feedbackId', AttributeType: 'S' }],
  ProvisionedThroughput: getProvisionedThroughput(),
});

export async function addFeedbackToDB(
  feedback: Feedback,
): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.PutItemOutput, AWS.AWSError>
> {
  const feedbackInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: TABLE_FEEDBACK,
    Item: {
      ...feedback,
      createdAt: formatISO(currentDate()),
    },
    ConditionExpression: 'attribute_not_exists(feedbackId)',
  };

  return dynamoDb.put(feedbackInput).promise();
}

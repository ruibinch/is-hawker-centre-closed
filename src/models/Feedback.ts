import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { getProvisionedThroughput } from '../common/dynamodb';
import { Stage } from '../common/types';
import { TABLE_FEEDBACK } from '../common/variables';
import { Feedback } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeFeedbackTableName = (stage: Stage): string =>
  `ihcc-feedback-${stage}`;

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
    Item: feedback,
    ConditionExpression: 'attribute_not_exists(feedbackId)',
  };

  return dynamoDb.put(feedbackInput).promise();
}

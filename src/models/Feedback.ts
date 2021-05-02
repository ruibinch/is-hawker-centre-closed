import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { TABLE_FEEDBACK } from '../common/variables';
import { Feedback } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

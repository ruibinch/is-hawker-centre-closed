import * as AWS from 'aws-sdk';
import bluebird from 'bluebird';
import { Result } from './types';

// AWS config
AWS.config.setPromisesDependency(bluebird);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'ishawkercentreclosed';

export function uploadData(data: Result[]) {
  Promise.all(
    data.map((result) => {
      const resultInfo: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: TABLE_NAME,
        Item: result,
        ConditionExpression: 'attribute_not_exists(id)',
      };
      return dynamoDb.put(resultInfo).promise();
    }),
  );
}

import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Result } from '../parser/types';

const TABLE_NAME = 'ishawkercentreclosed';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export function uploadData(data: Result[]): void {
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

export async function getTableData(): Promise<
  PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_NAME,
  };

  return dynamoDb.scan(params).promise();
}

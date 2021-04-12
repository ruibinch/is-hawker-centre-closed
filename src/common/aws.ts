import * as AWS from 'aws-sdk';
import { Result } from '../parser/types';

// AWS config
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

export async function getTableData() {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_NAME,
  };

  return dynamoDb.scan(params).promise();
}

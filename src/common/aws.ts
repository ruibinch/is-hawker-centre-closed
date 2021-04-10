import * as AWS from 'aws-sdk';
import { Result } from '../parser/types';
import { getCurrentPeriod } from './date';

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
    // .map((p) => p.catch((e) => e)),
  );
}

export async function searchByHawkerCentre(keyword: string): Promise<Result[]> {
  const currDate = getCurrentPeriod();
  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: TABLE_NAME,
    ExpressionAttributeValues: {
      ':p': currDate,
    },
    KeyConditionExpression: 'period = :p',
  };

  return dynamoDb
    .query(params)
    .promise()
    .then((response) => {
      const responseItems = response.Items as Result[];
      const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);

      const results = responseItems.filter((item) =>
        filterRegex.test(item.hawkerCentre.toLowerCase()),
      );
      return results;
    });
}

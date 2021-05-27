import * as AWS from 'aws-sdk';

import { initAWSConfig, TABLE_HC, TABLE_NAME_HC } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { DBResponse, getStage, Stage } from '../utils/types';
import { HawkerCentre } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeHawkerCentreTableName = (stage: Stage): string =>
  `${TABLE_NAME_HC}-${stage}`;

export const makeHawkerCentreSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeHawkerCentreTableName(stage),
  KeySchema: [
    {
      AttributeName: 'hawkerCentreId',
      KeyType: 'HASH',
    },
  ],
  AttributeDefinitions: [
    { AttributeName: 'hawkerCentreId', AttributeType: 'N' },
  ],
});

export async function uploadHawkerCentres(
  hawkerCentres: HawkerCentre[],
): Promise<void> {
  const hcTable = makeHawkerCentreTableName(getStage());

  await Promise.all(
    hawkerCentres.map((hawkerCentre) => {
      const hawkerCentreInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: hcTable,
        Item: hawkerCentre,
        ConditionExpression: 'attribute_not_exists(hawkerCentreId)',
      };
      return dynamoDb.put(hawkerCentreInput).promise();
    }),
  );
}

export async function getAllHawkerCentres(): Promise<DBResponse> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_HC,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (!scanOutput.Items) {
    return { success: false };
  }

  return {
    success: true,
    output: scanOutput.Items,
  };
}

export async function getHawkerCentreById(
  hawkerCentreId: number,
): Promise<DBResponse> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: TABLE_HC,
    Key: {
      hawkerCentreId,
    },
  };

  const getOutput = await dynamoDb.get(params).promise();

  if (getOutput === null) {
    return { success: false };
  }

  return {
    success: true,
    output: getOutput.Item,
  };
}

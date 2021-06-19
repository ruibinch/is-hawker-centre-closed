import * as AWS from 'aws-sdk';
import { Err, Ok, Result } from 'ts-results';

import { initAWSConfig, TABLE_HC, TABLE_NAME_HC } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { AWSError } from '../errors/AWSError';
import { getStage, Stage } from '../utils/types';
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
  console.log(`Uploaded ${hawkerCentres.length} entries to table "${hcTable}"`);
}

export async function getAllHawkerCentres(): Promise<
  Result<HawkerCentre[], AWSError>
> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_HC,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (!scanOutput.Items) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as HawkerCentre[]);
}

export async function getHawkerCentreById(
  hawkerCentreId: number,
): Promise<Result<HawkerCentre, AWSError>> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: TABLE_HC,
    Key: {
      hawkerCentreId,
    },
  };

  const getOutput = await dynamoDb.get(params).promise();

  if (getOutput === null) {
    return Err(new AWSError());
  }

  return Ok(getOutput.Item as HawkerCentre);
}

import * as AWS from 'aws-sdk';
import { Err, Ok, Result } from 'ts-results';

import {
  initAWSConfig,
  TABLE_NAME_CLOSURES,
  TABLE_CLOSURES,
} from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { AWSError } from '../errors/AWSError';
import { getStage, Stage } from '../utils/types';
import { Closure } from './types';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const makeClosureTableName = (stage: Stage): string =>
  `${TABLE_NAME_CLOSURES}-${stage}`;

export const makeClosureSchema = (
  stage: Stage,
): AWS.DynamoDB.CreateTableInput => ({
  ...getDynamoDBBillingDetails(),
  TableName: makeClosureTableName(stage),
  KeySchema: [
    {
      AttributeName: 'id',
      KeyType: 'HASH',
    },
    {
      AttributeName: 'hawkerCentreId',
      KeyType: 'RANGE',
    },
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'hawkerCentreId', AttributeType: 'N' },
  ],
});

export async function uploadClosures(closures: Closure[]): Promise<void> {
  const closuresTable = makeClosureTableName(getStage());

  await Promise.all(
    closures.map((closure) => {
      const closureInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: closuresTable,
        Item: closure,
        ConditionExpression: 'attribute_not_exists(id)',
      };
      return dynamoDb.put(closureInput).promise();
    }),
  );
  console.log(
    `Uploaded ${closures.length} entries to table "${closuresTable}"`,
  );
}

export async function getAllClosures(): Promise<Result<Closure[], AWSError>> {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_CLOSURES,
  };

  const scanOutput = await dynamoDb.scan(params).promise();

  if (scanOutput === null) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as Closure[]);
}

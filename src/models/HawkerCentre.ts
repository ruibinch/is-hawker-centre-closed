import * as AWS from 'aws-sdk';
import { Err, Ok, Result } from 'ts-results';

import { initAWSConfig, TABLE_HC, TABLE_NAME_HC } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { AWSError } from '../errors/AWSError';
import { getStage, Stage } from '../utils';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export type HawkerCentreProps = {
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string;
};

export class HawkerCentre {
  hawkerCentreId: number;

  name: string;

  nameSecondary?: string;

  private constructor(props: HawkerCentreProps) {
    this.hawkerCentreId = props.hawkerCentreId;
    this.name = props.name;
    this.nameSecondary = props.nameSecondary;
  }

  static getTableName(stage: Stage): string {
    return `${TABLE_NAME_HC}-${stage}`;
  }

  static getSchema(stage: Stage): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(stage),
      KeySchema: [
        {
          AttributeName: 'hawkerCentreId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        { AttributeName: 'hawkerCentreId', AttributeType: 'N' },
      ],
    };
  }
}

export async function uploadHawkerCentres(
  hawkerCentres: HawkerCentre[],
): Promise<void> {
  const hcTable = HawkerCentre.getTableName(getStage());

  await Promise.all(
    hawkerCentres.map((hawkerCentre) =>
      dynamoDb
        .put({
          TableName: hcTable,
          Item: hawkerCentre,
          ConditionExpression: 'attribute_not_exists(hawkerCentreId)',
        })
        .promise(),
    ),
  );
  console.log(`Uploaded ${hawkerCentres.length} entries to table "${hcTable}"`);
}

export async function getAllHawkerCentres(): Promise<
  Result<HawkerCentre[], AWSError>
> {
  const scanOutput = await dynamoDb
    .scan({
      TableName: TABLE_HC,
    })
    .promise();

  if (!scanOutput.Items) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as HawkerCentre[]);
}

export async function getHawkerCentreById(
  hawkerCentreId: number,
): Promise<Result<HawkerCentre, AWSError>> {
  const getOutput = await dynamoDb
    .get({
      TableName: TABLE_HC,
      Key: {
        hawkerCentreId,
      },
    })
    .promise();

  if (getOutput === null) {
    return Err(new AWSError());
  }

  return Ok(getOutput.Item as HawkerCentre);
}

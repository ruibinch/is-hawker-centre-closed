import * as AWS from 'aws-sdk';
import { Err, Ok, Result } from 'ts-results';

import { initAWSConfig, TABLE_CLOSURES } from '../aws/config';
import { getDynamoDBBillingDetails } from '../aws/dynamodb';
import { AWSError } from '../errors/AWSError';
import { getStage } from '../utils';
import { HawkerCentre } from './HawkerCentre';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export type Closure = HawkerCentre & ClosureObject;

export type ClosurePartial = HawkerCentre & Partial<ClosureObject>;

export type ClosureReason = 'cleaning' | 'others';

type HawkerCentreClosureProps = {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

export class ClosureObject {
  id: string;

  reason: ClosureReason;

  startDate: string;

  endDate: string;

  private constructor(props: HawkerCentreClosureProps) {
    this.id = props.id;
    this.reason = props.reason;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }

  static getTableName(): string {
    return `${TABLE_CLOSURES}-${getStage()}`;
  }

  static getSchema(): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(),
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
    };
  }
}

export async function uploadClosures(closures: Closure[]): Promise<void> {
  const closuresTable = ClosureObject.getTableName();

  await Promise.all(
    closures.map((closure) =>
      dynamoDb
        .put({
          TableName: closuresTable,
          Item: closure,
          ConditionExpression: 'attribute_not_exists(id)',
        })
        .promise(),
    ),
  );
  console.log(
    `Uploaded ${closures.length} entries to table "${closuresTable}"`,
  );
}

export async function getAllClosures(): Promise<Result<Closure[], AWSError>> {
  const scanOutput = await dynamoDb
    .scan({
      TableName: ClosureObject.getTableName(),
    })
    .promise();

  if (scanOutput === null) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as Closure[]);
}

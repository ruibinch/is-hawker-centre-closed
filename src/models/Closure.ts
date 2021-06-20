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
import { HawkerCentre } from './HawkerCentre';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export type Closure = HawkerCentre & HawkerCentreClosure;

export type ClosurePartial = HawkerCentre & Partial<HawkerCentreClosure>;

export type ClosureReason = 'cleaning' | 'others';

type HawkerCentreClosureProps = {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

class HawkerCentreClosure {
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

  static getTableName(stage: Stage): string {
    return `${TABLE_NAME_CLOSURES}-${stage}`;
  }

  static getSchema(stage: Stage): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(stage),
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
  const closuresTable = HawkerCentreClosure.getTableName(getStage());

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
      TableName: TABLE_CLOSURES,
    })
    .promise();

  if (scanOutput === null) {
    return Err(new AWSError());
  }

  return Ok(scanOutput.Items as Closure[]);
}

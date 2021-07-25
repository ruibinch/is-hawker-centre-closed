import * as AWS from 'aws-sdk';
import { Err, Ok, Result } from 'ts-results';

import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_CLOSURES } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { getStage, prettifyJSON } from '../utils';
import { HawkerCentre } from './HawkerCentre';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export type Closure = HawkerCentre & ClosureObject;

export type ClosurePartial = HawkerCentre & Partial<ClosureObject>;

export type ClosureReason = 'cleaning' | 'deepCleaning' | 'others';

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

  static create(props: HawkerCentreClosureProps): ClosureObject {
    return new ClosureObject(props);
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
  await sendDiscordAdminMessage(
    `[${getStage()}] SEEDING DB\n` +
      `Uploaded ${closures.length} entries to table "${closuresTable}"`,
  );
}

export async function addClosure(closure: Closure): Promise<void> {
  await dynamoDb
    .put({
      TableName: ClosureObject.getTableName(),
      Item: closure,
      ConditionExpression: 'attribute_not_exists(id)',
    })
    .promise();
  await sendDiscordAdminMessage(
    `[${getStage()}] ADDED CLOSURE ENTRY\n${prettifyJSON(closure)}`,
  );
}

export async function deleteClosure(
  closureId: string,
  hawkerCentreId: number,
): Promise<Result<Closure, AWSError | void>> {
  const deleteOutput = await dynamoDb
    .delete({
      TableName: ClosureObject.getTableName(),
      Key: { id: closureId, hawkerCentreId },
      ReturnValues: 'ALL_OLD',
    })
    .promise();

  if (deleteOutput === null) {
    return Err(new AWSError());
  }
  if (!deleteOutput.Attributes) {
    return Err.EMPTY;
  }

  const closure = deleteOutput.Attributes;
  await sendDiscordAdminMessage(
    `[${getStage()}] DELETED CLOSURE ENTRY\n${prettifyJSON(closure)}`,
  );
  return Ok(closure as Closure);
}

export async function getAllClosures(): Promise<Result<Closure[], Error>> {
  try {
    const scanOutput = await dynamoDb
      .scan({ TableName: ClosureObject.getTableName() })
      .promise();

    if (!scanOutput.Items) {
      return Err(new AWSError());
    }

    return Ok(scanOutput.Items as Closure[]);
  } catch (err) {
    return Err(err);
  }
}

export function isClosure(obj: Closure | HawkerCentre): obj is Closure {
  return ['id', 'reason', 'startDate', 'endDate'].every((key) => key in obj);
}

export function isValidClosureReason(text: string): text is ClosureReason {
  // TODO: explore on improving this
  return text === 'cleaning' || text === 'deepCleaning' || text === 'others';
}

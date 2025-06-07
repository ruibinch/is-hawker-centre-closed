import {
  CreateTableInput,
  DynamoDBServiceException,
} from '@aws-sdk/client-dynamodb';
import { DeleteCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { AWSError } from '../errors/AWSError';
import { TABLE_CLOSURES } from '../ext/aws/config';
import { ddbDocClient, getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Result, type ResultType } from '../lib/Result';
import { prettifyJSON, wrapUnknownError } from '../utils';
import { getStage } from '../utils/stage';
import type { HawkerCentre } from './HawkerCentre';

type HawkerCentreInfo = Pick<
  HawkerCentre,
  'hawkerCentreId' | 'name' | 'nameSecondary' | 'keywords'
>;

export type Closure = HawkerCentreInfo & ClosureObject;

export type ClosurePartial = HawkerCentreInfo & Partial<ClosureObject>;

export type ClosureReason = 'cleaning' | 'others';

type HawkerCentreClosureProps = {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
  remarks?: string;
};

export class ClosureObject {
  id: string;

  reason: ClosureReason;

  startDate: string;

  endDate: string;

  remarks: string | null | undefined;

  private constructor(props: HawkerCentreClosureProps) {
    this.id = props.id;
    this.reason = props.reason;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.remarks = props.remarks;
  }

  static create(props: HawkerCentreClosureProps): ClosureObject {
    return new ClosureObject(props);
  }

  static getTableName(): string {
    return `${TABLE_CLOSURES}-${getStage()}`;
  }

  static getSchema(): CreateTableInput {
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

  console.info(
    `Uploading ${closures.length} closures to table ${closuresTable}`,
  );
  await Promise.all(
    closures.map((closure) => {
      const command = new PutCommand({
        TableName: closuresTable,
        Item: closure,
        ConditionExpression: 'attribute_not_exists(id)',
      });
      ddbDocClient.send(command);
    }),
  );
  await sendDiscordAdminMessage([
    `**[${getStage()}]  🌱 SEEDING DB**`,
    `Uploaded ${closures.length} entries to table "${closuresTable}"`,
  ]);
}

export async function addClosure(props: {
  closure: Closure;
  shouldSendMessage?: boolean;
}): Promise<void> {
  const { closure } = props;
  const shouldSendMessage = props.shouldSendMessage ?? true;

  console.info(`Adding closure entry: ${prettifyJSON(closure)}`);
  const command = new PutCommand({
    TableName: ClosureObject.getTableName(),
    Item: closure,
    ConditionExpression: 'attribute_not_exists(id)',
  });
  ddbDocClient.send(command);

  if (shouldSendMessage) {
    await sendDiscordAdminMessage([
      `**[${getStage()}] ADDED CLOSURE ENTRY**`,
      `${prettifyJSON(closure)}`,
    ]);
  }
}

export async function deleteClosure(props: {
  closureId: string;
  hawkerCentreId: number;
  shouldSendMessage?: boolean;
}): Promise<ResultType<Closure, AWSError>> {
  const { closureId, hawkerCentreId } = props;
  const shouldSendMessage = props.shouldSendMessage ?? true;

  try {
    console.info(
      `Deleting closure with closureId=${closureId}, hawkerCentreId=${hawkerCentreId}`,
    );
    const command = new DeleteCommand({
      TableName: ClosureObject.getTableName(),
      Key: { closureId, hawkerCentreId },
      ReturnValues: 'ALL_OLD',
    });
    const deleteOutput = await ddbDocClient.send(command);

    if (!deleteOutput.Attributes) {
      throw new Error('Missing attributes in delete output');
    }

    const closure = deleteOutput.Attributes;
    if (shouldSendMessage) {
      await sendDiscordAdminMessage([
        `**[${getStage()}] DELETED CLOSURE ENTRY**`,
        `${prettifyJSON(closure)}`,
      ]);
    }

    return Result.Ok(closure as Closure);
  } catch (err) {
    const errorMessage = (() => {
      if (err instanceof DynamoDBServiceException) {
        return err.message;
      }
      if (err instanceof Error) {
        return err.message;
      }
      return undefined;
    })();

    return Result.Err(new AWSError(errorMessage));
  }
}

export async function getAllClosures(): Promise<ResultType<Closure[], Error>> {
  try {
    console.info(
      `Fetching all closures from table ${ClosureObject.getTableName()}`,
    );
    const command = new ScanCommand({
      TableName: ClosureObject.getTableName(),
    });
    const scanOutput = await ddbDocClient.send(command);

    if (!scanOutput.Items) {
      throw new AWSError('Missing items in scan output');
    }

    return Result.Ok(scanOutput.Items as Closure[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export function isClosure(obj: Closure | HawkerCentre): obj is Closure {
  return ['id', 'reason', 'startDate', 'endDate'].every((key) => key in obj);
}

export function isValidClosureReason(text: string): text is ClosureReason {
  // TODO: explore on improving this
  return text === 'cleaning' || text === 'others';
}

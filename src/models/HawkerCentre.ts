import * as AWS from 'aws-sdk';

import { AWSError } from '../errors/AWSError';
import { initAWSConfig, TABLE_HC } from '../ext/aws/config';
import { getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Result, type ResultType } from '../lib/Result';
import { wrapUnknownError } from '../utils';
import { getStage } from '../utils/stage';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export type HawkerCentreProps = {
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string | undefined;
};

export class HawkerCentre {
  hawkerCentreId: number;

  name: string;

  nameSecondary?: string | undefined;

  private constructor(props: HawkerCentreProps) {
    this.hawkerCentreId = props.hawkerCentreId;
    this.name = props.name;
    this.nameSecondary = props.nameSecondary;
  }

  static getTableName(): string {
    return `${TABLE_HC}-${getStage()}`;
  }

  static getSchema(): AWS.DynamoDB.CreateTableInput {
    return {
      ...getDynamoDBBillingDetails(),
      TableName: this.getTableName(),
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
  const hcTable = HawkerCentre.getTableName();

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
  await sendDiscordAdminMessage([
    `**[${getStage()}]  🌱 SEEDING DB**`,
    `Uploaded ${hawkerCentres.length} entries to table "${hcTable}"`,
  ]);
}

export async function getAllHawkerCentres(): Promise<
  ResultType<HawkerCentre[], Error>
> {
  try {
    const scanOutput = await dynamoDb
      .scan({ TableName: HawkerCentre.getTableName() })
      .promise();

    if (!scanOutput.Items) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(scanOutput.Items as HawkerCentre[]);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

export async function getHawkerCentreById(
  hawkerCentreId: number,
): Promise<ResultType<HawkerCentre, Error>> {
  try {
    const getOutput = await dynamoDb
      .get({
        TableName: HawkerCentre.getTableName(),
        Key: { hawkerCentreId },
      })
      .promise();

    if (!getOutput.Item) {
      return Result.Err(new AWSError());
    }

    return Result.Ok(getOutput.Item as HawkerCentre);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

import { CreateTableInput } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { AWSError } from '../errors/AWSError';
import { TABLE_HC } from '../ext/aws/config';
import { ddbDocClient, getDynamoDBBillingDetails } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Result, type ResultType } from '../lib/Result';
import { wrapUnknownError } from '../utils';
import { getStage } from '../utils/stage';

export type HawkerCentreProps = {
  hawkerCentreId: number;
  address: string;
  name: string;
  nameSecondary?: string | undefined;
  keywords?: string[];
};

export class HawkerCentre {
  hawkerCentreId: number;

  address: string;

  name: string;

  nameSecondary?: string | undefined;

  keywords?: string[] | undefined;

  private constructor(props: HawkerCentreProps) {
    this.hawkerCentreId = props.hawkerCentreId;
    this.address = props.address;
    this.name = props.name;
    this.nameSecondary = props.nameSecondary;
    this.keywords = props.keywords;
  }

  static getTableName(): string {
    return `${TABLE_HC}-${getStage()}`;
  }

  static getSchema(): CreateTableInput {
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

  console.info(
    `Uploading ${hawkerCentres.length} hawker centres to table ${hcTable}`,
  );
  await Promise.all(
    hawkerCentres.map((hawkerCentre) => {
      const command = new PutCommand({
        TableName: hcTable,
        Item: hawkerCentre,
        ConditionExpression: 'attribute_not_exists(hawkerCentreId)',
      });
      ddbDocClient.send(command);
    }),
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
    console.info(
      `Fetching all hawker centres from table ${HawkerCentre.getTableName()}`,
    );
    const command = new ScanCommand({ TableName: HawkerCentre.getTableName() });
    const scanOutput = await ddbDocClient.send(command);

    if (!scanOutput.Items) {
      throw new AWSError('Missing items in scan output');
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
    console.info(
      `Fetching hawker centre with id=${hawkerCentreId} from table ${HawkerCentre.getTableName()}`,
    );
    const command = new GetCommand({
      TableName: HawkerCentre.getTableName(),
      Key: { hawkerCentreId },
    });
    const getOutput = await ddbDocClient.send(command);

    if (!getOutput.Item) {
      throw new AWSError('Missing item in get output');
    }

    return Result.Ok(getOutput.Item as HawkerCentre);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

// TODO: update when primary key is changed for HawkerCentre table
export async function getHawkerCentreByName(
  hawkerCentreName: string,
): Promise<ResultType<HawkerCentre, Error>> {
  const getAllHawkerCentresResult = await getAllHawkerCentres();
  if (getAllHawkerCentresResult.isErr) {
    return Result.Err(getAllHawkerCentresResult.value);
  }

  const hawkerCentres = getAllHawkerCentresResult.value;
  const hawkerCentreMatch = hawkerCentres.find(
    (hawkerCentre) => hawkerCentre.name === hawkerCentreName,
  );

  return hawkerCentreMatch
    ? Result.Ok(hawkerCentreMatch)
    : Result.Err(
        new Error(`No hawker centre match found with name ${hawkerCentreName}`),
      );
}

import * as AWS from 'aws-sdk';

import { initAWSConfig, TABLE_FEEDBACK, TABLE_USERS } from '../aws/config';
import { sendDiscordMessage } from '../ext/discord';
import { getStage, notEmpty } from '../utils';
import { currentDateInYYYYMMDD, formatDateWithTime } from '../utils/date';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();
const stage = getStage();

const TABLES_TO_BACKUP = [TABLE_USERS, TABLE_FEEDBACK];

function getTablesToBackup() {
  return TABLES_TO_BACKUP.map((tableName) => `${tableName}-${stage}`);
}

function generateBackupDetailsOutput(
  backupDetails: AWS.DynamoDB.BackupDetails,
) {
  const { BackupName, BackupSizeBytes, BackupCreationDateTime } = backupDetails;

  return `${BackupName} (${
    BackupSizeBytes ?? 'unknown'
  } bytes; created at ${formatDateWithTime(BackupCreationDateTime)})`;
}

async function deleteBackups() {
  const backupsList = await dynamoDb.listBackups().promise();
  if (!backupsList.BackupSummaries) {
    await sendDiscordMessage(
      `[${stage}] BACKUP DELETION UNSUCCESSFUL\n\nUnable to view list of backups`,
    );
    return;
  }

  // TODO: keep last 3 backups instead of deleting all
  const backupsARN = backupsList.BackupSummaries.reduce(
    (arr: string[], summary) => {
      if (summary.BackupArn && summary.TableName?.endsWith(stage)) {
        arr.push(summary.BackupArn);
      }
      return arr;
    },
    [],
  );

  const responses = await Promise.all(
    backupsARN.map((backupARN) =>
      dynamoDb
        .deleteBackup({
          BackupArn: backupARN,
        })
        .promise(),
    ),
  );

  const responsesOutput = responses
    .map((response, idx) => {
      const backupDetails = response.BackupDescription?.BackupDetails;
      return backupDetails
        ? `${idx + 1}. ${generateBackupDetailsOutput(backupDetails)}`
        : undefined;
    })
    .filter(notEmpty);

  await sendDiscordMessage(
    `[${stage}] BACKUPS DELETED\n\n${
      responsesOutput.length === 0 ? 'none' : responsesOutput.join('\n')
    }`,
  );
}

async function createBackups() {
  const responses = await Promise.all(
    getTablesToBackup().map((fullTableName) =>
      dynamoDb
        .createBackup({
          BackupName: `${fullTableName}-${currentDateInYYYYMMDD()}`,
          TableName: fullTableName,
        })
        .promise(),
    ),
  );

  const responsesOutput = responses
    .map((response, idx) => {
      const backupDetails = response.BackupDetails;
      return backupDetails
        ? `${idx + 1}. ${generateBackupDetailsOutput(backupDetails)}`
        : undefined;
    })
    .filter(notEmpty);

  await sendDiscordMessage(
    `[${stage}] BACKUPS CREATED\n\n${
      responsesOutput.length === 0 ? 'none' : responsesOutput.join('\n')
    }`,
  );
}

export async function run(): Promise<void> {
  await deleteBackups();
  await createBackups();
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

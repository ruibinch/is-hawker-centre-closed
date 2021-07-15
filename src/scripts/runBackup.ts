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

type BackupEntry = {
  backupArn: string;
  backupCreationDateTime: Date;
};

function getBackupsForTables(backupSummaries: AWS.DynamoDB.BackupSummaries) {
  const backupsForTables = backupSummaries.reduce(
    (_backupsForTables: Record<string, BackupEntry[]>, summary) => {
      if (
        summary.BackupArn &&
        summary.BackupCreationDateTime &&
        summary.TableName?.endsWith(stage)
      ) {
        _backupsForTables[summary.TableName] = [
          ...(_backupsForTables[summary.TableName] ?? []),
          {
            backupArn: summary.BackupArn,
            backupCreationDateTime: summary.BackupCreationDateTime,
          },
        ];
      }

      return _backupsForTables;
    },
    {},
  );

  const backupsForTablesSorted = Object.entries(backupsForTables).reduce(
    (
      _backupsForTablesSorted: Record<string, BackupEntry[]>,
      [tableName, backupsForTable],
    ) => {
      // sort in descending order of time
      _backupsForTablesSorted[tableName] = [...backupsForTable].sort(
        (a, b) =>
          b.backupCreationDateTime.getTime() -
          a.backupCreationDateTime.getTime(),
      );
      return _backupsForTablesSorted;
    },
    {},
  );

  return backupsForTablesSorted;
}

function getBackupsToDelete(backupsForTables: Record<string, BackupEntry[]>) {
  return Object.values(backupsForTables).reduce(
    (_backupsToDelete: string[], backupsForTable) => {
      // keep the latest 3 backups, i.e. first 3 array entries
      const backupsToDeleteForTable = backupsForTable
        .slice(3)
        .map((backupEntry) => backupEntry.backupArn);

      return [..._backupsToDelete, ...backupsToDeleteForTable];
    },
    [],
  );
}

async function deleteBackups() {
  const backupsList = await dynamoDb.listBackups().promise();
  if (!backupsList.BackupSummaries) {
    await sendDiscordMessage(
      `[${stage}] BACKUP DELETION UNSUCCESSFUL\n\nUnable to view list of backups`,
    );
    return;
  }

  const backupsForTables = getBackupsForTables(backupsList.BackupSummaries);

  const backupsToDelete = getBackupsToDelete(backupsForTables);

  const responses = await Promise.all(
    backupsToDelete.map((backupARN) =>
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

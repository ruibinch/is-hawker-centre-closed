import {
  BackupDetails,
  BackupSummary,
  CreateBackupCommand,
  DeleteBackupCommand,
  ListBackupsCommand,
} from '@aws-sdk/client-dynamodb';

import { DBError } from '../errors/DBError';
import { TABLE_FEEDBACK, TABLE_INPUTS, TABLE_USERS } from '../ext/aws/config';
import { ddbDocClient } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { notEmpty } from '../utils';
import { currentDateInYYYYMMDD, formatDateWithTime } from '../utils/date';
import { getStage } from '../utils/stage';

const stage = getStage();

const TABLES_TO_BACKUP = [TABLE_USERS, TABLE_FEEDBACK, TABLE_INPUTS];

function getTablesToBackup() {
  return TABLES_TO_BACKUP.map((tableName) => `${tableName}-${stage}`);
}

function generateBackupDetailsOutput(backupDetails: BackupDetails) {
  const { BackupName, BackupSizeBytes, BackupCreationDateTime } = backupDetails;

  return `${BackupName} (${BackupSizeBytes ?? 'unknown'} bytes; created at ${
    BackupCreationDateTime
      ? formatDateWithTime(BackupCreationDateTime)
      : 'unknown'
  })`;
}

type BackupEntry = {
  backupArn: string;
  backupCreationDateTime: Date;
};

function getBackupsForTables(backupSummaries: BackupSummary[]) {
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
  // keep last 1 backup in prod, and none in dev (this excludes the backup to be createdg)
  const NUM_BACKUPS_RETAIN = stage === 'prod' ? 1 : 0;

  return Object.values(backupsForTables).reduce(
    (_backupsToDelete: string[], backupsForTable) => {
      const backupsToDeleteForTable = backupsForTable
        .slice(NUM_BACKUPS_RETAIN)
        .map((backupEntry) => backupEntry.backupArn);

      return [..._backupsToDelete, ...backupsToDeleteForTable];
    },
    [],
  );
}

async function deleteBackups() {
  const listBackupsCommand = new ListBackupsCommand();
  const backupsList = await ddbDocClient.send(listBackupsCommand);
  const backupSummaries = backupsList.BackupSummaries;

  if (!backupSummaries) {
    const errorMessage =
      '🚨 **BACKUP DELETION UNSUCCESSFUL**\nUnable to view list of backups';
    await sendDiscordAdminMessage(`[${stage}] ${errorMessage}`);
    throw new DBError(errorMessage);
  }

  const backupsForTables = getBackupsForTables(backupSummaries);

  const backupsToDelete = getBackupsToDelete(backupsForTables);

  const responses = await Promise.all(
    backupsToDelete.map((backupARN) => {
      const deleteBackupCommand = new DeleteBackupCommand({
        BackupArn: backupARN,
      });
      return ddbDocClient.send(deleteBackupCommand);
    }),
  );

  const responsesOutput = responses
    .map((response, idx) => {
      const backupDetails = response.BackupDescription?.BackupDetails;
      return backupDetails
        ? `${idx + 1}. ${generateBackupDetailsOutput(backupDetails)}`
        : undefined;
    })
    .filter(notEmpty);

  await sendDiscordAdminMessage([
    `**[${stage}] 🗄❌ BACKUPS DELETED**`,
    `${responsesOutput.length === 0 ? '-' : responsesOutput.join('\n')}`,
  ]);
}

async function createBackups() {
  const responses = await Promise.all(
    getTablesToBackup().map((fullTableName) => {
      const command = new CreateBackupCommand({
        TableName: fullTableName,
        BackupName: `${fullTableName}-${currentDateInYYYYMMDD()}`,
      });
      return ddbDocClient.send(command);
    }),
  );

  const responsesOutput = responses
    .map((response, idx) => {
      const backupDetails = response.BackupDetails;
      return backupDetails
        ? `${idx + 1}. ${generateBackupDetailsOutput(backupDetails)}`
        : undefined;
    })
    .filter(notEmpty);

  await sendDiscordAdminMessage([
    `**[${stage}] 🗄☑️ BACKUPS CREATED**`,
    `${responsesOutput.length === 0 ? '-' : responsesOutput.join('\n')}`,
  ]);
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

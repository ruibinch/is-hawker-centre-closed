import {
  DeleteTableCommand,
  ListBackupsCommand,
  RestoreTableFromBackupCommand,
} from '@aws-sdk/client-dynamodb';

import { DBError } from '../errors/DBError';
import { TABLE_FEEDBACK, TABLE_USERS } from '../ext/aws/config';
import { DDB_PROPAGATE_DURATION, ddbDocClient } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { sleep } from '../utils';
import { formatDateWithTime } from '../utils/date';
import { getStage } from '../utils/stage';

const CLI_KEYWORD = process.env['CLI_KEYWORD'];

function makeSuccessMessage(s: string) {
  return `**RESTORE SUCCESSFUL**\n${s}`;
}

function makeErrorMessage(s: string) {
  return `🚨 **RESTORE UNSUCCESSFUL**\n${s}`;
}

function makeInProgressMessage(s: string) {
  return `**RESTORE IN PROGRESS**\n${s}`;
}

async function restoreBackup(tableName: string) {
  const listBackupsCommand = new ListBackupsCommand();
  const backupsList = await ddbDocClient.send(listBackupsCommand);
  if (!backupsList.BackupSummaries) {
    const errorMessage = makeErrorMessage('Unable to view list of backups');
    await sendDiscordAdminMessage(errorMessage);
    throw new DBError(errorMessage);
  }

  const fullTableName = `${tableName}-${getStage()}`;
  const backupsForTable = backupsList.BackupSummaries.filter(
    (backupEntry) => backupEntry.TableName === fullTableName,
  );
  if (backupsForTable.length === 0) {
    const errorMessage = makeErrorMessage(
      `No backups found for table ${fullTableName}`,
    );
    await sendDiscordAdminMessage(errorMessage);
    throw new DBError(errorMessage);
  }

  // Assume that there is only 1 backup for each table
  const [latestBackup] = backupsForTable;
  const { BackupArn: latestBackupArn, BackupSizeBytes } = latestBackup;
  if (!latestBackupArn) {
    const errorMessage = makeErrorMessage('latestBackupArn value is null');
    await sendDiscordAdminMessage(errorMessage);
    throw new DBError(errorMessage);
  }
  if (BackupSizeBytes === 0) {
    const errorMessage = makeErrorMessage(
      `Backup "${latestBackupArn}" is empty`,
    );
    await sendDiscordAdminMessage(errorMessage);
    throw new DBError(errorMessage);
  }

  const deleteTableCommand = new DeleteTableCommand({
    TableName: fullTableName,
  });
  const deleteOutput = await ddbDocClient.send(deleteTableCommand);
  await sendDiscordAdminMessage(
    makeInProgressMessage(
      `Deleted table "${deleteOutput.TableDescription?.TableName}"`,
    ),
  );

  await sleep(DDB_PROPAGATE_DURATION);

  const restoreTableFromBackupCommand = new RestoreTableFromBackupCommand({
    BackupArn: latestBackupArn,
    TargetTableName: fullTableName,
  });
  const restoreOutput = await ddbDocClient.send(restoreTableFromBackupCommand);
  const restoreSummary = restoreOutput.TableDescription?.RestoreSummary;
  const restoreMessage = `Restored backup "${
    restoreSummary ? restoreSummary.SourceBackupArn : 'null'
  }" created at "${
    restoreSummary?.RestoreDateTime
      ? formatDateWithTime(restoreSummary.RestoreDateTime)
      : 'null'
  }" to table "${fullTableName}"`;

  await sendDiscordAdminMessage(makeSuccessMessage(restoreMessage));
}

async function run() {
  if (CLI_KEYWORD === 'all') {
    await restoreBackup(TABLE_USERS);
    await restoreBackup(TABLE_FEEDBACK);
  } else if (CLI_KEYWORD === 'users') {
    await restoreBackup(TABLE_USERS);
  } else if (CLI_KEYWORD === 'feedback') {
    await restoreBackup(TABLE_FEEDBACK);
  } else {
    throw new Error(
      CLI_KEYWORD === undefined
        ? 'No keyword specified'
        : `"${CLI_KEYWORD}" is not an accepted keyword`,
    );
  }

  process.exit(0);
}

run();

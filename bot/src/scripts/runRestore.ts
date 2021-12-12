import * as AWS from 'aws-sdk';

import { DBError } from '../errors/DBError';
import { initAWSConfig, TABLE_FEEDBACK, TABLE_USERS } from '../ext/aws/config';
import { sendDiscordAdminMessage } from '../ext/discord';
import { getStage, sleep } from '../utils';
import { formatDateWithTime } from '../utils/date';

const args = process.argv.slice(2);
const [keyword] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

function makeSuccessMessage(s: string) {
  return `RESTORE SUCCESSFUL\n${s}`;
}

function makeErrorMessage(s: string) {
  return `RESTORE UNSUCCESSFUL\n${s}`;
}

function makeInProgressMessage(s: string) {
  return `RESTORE IN PROGRESS\n${s}`;
}

async function restoreBackup(tableName: string) {
  const backupsList = await dynamoDb.listBackups().promise();
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
      makeErrorMessage(`Backup "${latestBackupArn}" is empty`),
    );
    await sendDiscordAdminMessage(errorMessage);
    throw new DBError(errorMessage);
  }

  const deleteOutput = await dynamoDb
    .deleteTable({ TableName: fullTableName })
    .promise();
  await sendDiscordAdminMessage(
    makeInProgressMessage(
      `Deleted table "${deleteOutput.TableDescription?.TableName}"`,
    ),
  );

  // sleep for 2 secs for deletion process to propagate
  await sleep(2000);

  const restoreOutput = await dynamoDb
    .restoreTableFromBackup({
      BackupArn: latestBackupArn,
      TargetTableName: fullTableName,
    })
    .promise();
  const restoreSummary = restoreOutput.TableDescription?.RestoreSummary;
  const restoreMessage = `Restored backup "${
    restoreSummary ? restoreSummary.SourceBackupArn : 'null'
  }" created at "${
    restoreSummary ? formatDateWithTime(restoreSummary.RestoreDateTime) : 'null'
  }" to table "${fullTableName}"`;

  await sendDiscordAdminMessage(makeSuccessMessage(restoreMessage));
}

async function run() {
  if (keyword === 'all') {
    await restoreBackup(TABLE_USERS);
    await restoreBackup(TABLE_FEEDBACK);
  } else if (keyword === 'users') {
    await restoreBackup(TABLE_USERS);
  } else if (keyword === 'feedback') {
    await restoreBackup(TABLE_FEEDBACK);
  } else {
    throw new Error(`"${keyword}" is not an accepted keyword`);
  }

  process.exit(0);
}

run();

import * as AWS from 'aws-sdk';

import { initAWSConfig, TABLE_FEEDBACK, TABLE_USERS } from '../aws/config';
import { sendDiscordMessage } from '../ext/discord';
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
    await sendDiscordMessage(
      makeErrorMessage('Unable to view list of backups'),
    );
    return;
  }

  const fullTableName = `${tableName}-${getStage()}`;
  const backupsForTable = backupsList.BackupSummaries.filter(
    (backupEntry) => backupEntry.TableName === fullTableName,
  );
  if (backupsForTable.length === 0) {
    await sendDiscordMessage(
      makeErrorMessage(`No backups found for table ${fullTableName}`),
    );
    return;
  }

  // Assume that there is only 1 backup for each table
  const [latestBackup] = backupsForTable;
  const { BackupArn: latestBackupArn, BackupSizeBytes } = latestBackup;
  if (!latestBackupArn) {
    await sendDiscordMessage(makeErrorMessage('latestBackupArn value is null'));
    return;
  }
  if (BackupSizeBytes === 0) {
    await sendDiscordMessage(
      makeErrorMessage(`Backup "${latestBackupArn}" is empty`),
    );
    return;
  }

  const deleteOutput = await dynamoDb
    .deleteTable({ TableName: fullTableName })
    .promise();
  await sendDiscordMessage(
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

  await sendDiscordMessage(makeSuccessMessage(restoreMessage));
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

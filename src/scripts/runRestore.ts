import * as AWS from 'aws-sdk';

import { initAWSConfig, TABLE_FEEDBACK, TABLE_USERS } from '../aws/config';
import { getStage, sleep } from '../utils';

const args = process.argv.slice(2);
const [keyword] = args;

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

async function restoreBackup(tableName: string) {
  const backupsList = await dynamoDb.listBackups().promise();
  if (!backupsList.BackupSummaries) {
    throw new Error('Unable to view list of backups');
  }

  const stage = getStage();
  const fullTableName = `${tableName}-${stage}`;

  const backupsForTable = backupsList.BackupSummaries.filter(
    (backupEntry) => backupEntry.TableName === fullTableName,
  );
  if (backupsForTable.length === 0) {
    throw new Error(`No backups found for table ${fullTableName}`);
  }

  // Assume that there is only 1 backup for each table, or that the latest backup is the first entry
  const [latestBackup] = backupsForTable;
  const { BackupArn: latestBackupArn, BackupSizeBytes } = latestBackup;
  if (!latestBackupArn) {
    throw new Error(`latestBackupArn value is null`);
  }
  if (BackupSizeBytes === 0) {
    throw new Error(`Backup ${latestBackupArn} is empty`);
  }

  const deleteOutput = await dynamoDb
    .deleteTable({
      TableName: fullTableName,
    })
    .promise();
  console.log(`Deleted table: ${deleteOutput.TableDescription?.TableName}\n`);

  // sleep for 2 secs for deletion process to propagate
  await sleep(2000);

  const restoreOutput = await dynamoDb
    .restoreTableFromBackup({
      BackupArn: latestBackupArn,
      TargetTableName: `${fullTableName}`,
    })
    .promise();
  // prettier-ignore
  console.log(
    `Restored backup "${
      restoreOutput.TableDescription?.RestoreSummary?.SourceBackupArn
    }" created at "${
      restoreOutput.TableDescription?.RestoreSummary?.RestoreDateTime
    }" to table "${fullTableName}"\n`,
  );
}

if (keyword === 'all') {
  restoreBackup(TABLE_USERS);
  restoreBackup(TABLE_FEEDBACK);
} else if (keyword === 'users') {
  restoreBackup(TABLE_USERS);
} else if (keyword === 'feedback') {
  restoreBackup(TABLE_FEEDBACK);
} else {
  throw new Error(`"${keyword}" is not an accepted keyword`);
}

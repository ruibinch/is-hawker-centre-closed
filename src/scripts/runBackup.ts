import * as AWS from 'aws-sdk';

import {
  initAWSConfig,
  TABLE_NAME_FEEDBACK,
  TABLE_NAME_USERS,
} from '../aws/config';
import { currentDateInYYYYMMDD } from '../utils/date';

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

const tablesToBackup = [TABLE_NAME_USERS, TABLE_NAME_FEEDBACK];

async function clearBackups() {
  const backupsList = await dynamoDb.listBackups().promise();
  if (!backupsList.BackupSummaries) {
    throw new Error('Unable to view list of backups');
  }

  const backupsARN = backupsList.BackupSummaries.reduce(
    (arr: string[], summary) => {
      if (summary.BackupArn) {
        arr.push(summary.BackupArn);
      }
      return arr;
    },
    [],
  );

  await Promise.all(
    backupsARN.map((backupARN) =>
      dynamoDb
        .deleteBackup({
          BackupArn: backupARN,
        })
        .promise(),
    ),
  )
    .then((response) => {
      console.log('Backups deleted:', JSON.stringify(response, null, 4));
    })
    .catch((error) => {
      console.log(error);
      throw new Error('Error encountered when deleting backups');
    });
}

async function createBackup() {
  await Promise.all(
    tablesToBackup.map((tableName) =>
      dynamoDb
        .createBackup({
          BackupName: `${tableName}-${currentDateInYYYYMMDD()}`,
          TableName: `${tableName}-prod`,
        })
        .promise(),
    ),
  ).then((response) => {
    console.log('\nBackups created:', JSON.stringify(response, null, 4));
  });
}

clearBackups().then(() => createBackup());

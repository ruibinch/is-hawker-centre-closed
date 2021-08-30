import { sendDiscordAdminMessage } from '../ext/discord';
import { getStage } from '../utils';
import { addEntry, deleteEntry } from './manageClosureTable';

const FIXES = {
  add: [
    '103 deepCleaning 2021-07-14 2021-08-14',
    '107 deepCleaning 2021-07-17 2021-07-31',
    '7 deepCleaning 2021-07-18 2021-08-01',
    '50 deepCleaning 2021-07-21 2021-08-04',
    '113 deepCleaning 2021-07-21 2021-08-04',
    '38 deepCleaning 2021-07-22 2021-08-05',
    '111 deepCleaning 2021-07-22 2021-08-05',
    '23 deepCleaning 2021-07-23 2021-08-06',
    '60 deepCleaning 2021-08-05 2021-08-19',
  ],
  delete: [
    '107 others 2021-07-17 2021-07-31',
    '7 others 2021-07-18 2021-08-01',
    '50 others 2021-07-21 2021-08-04',
    '113 others 2021-07-21 2021-08-04',
    '38 others 2021-07-22 2021-08-05',
    '111 others 2021-07-22 2021-08-05',
    '23 others 2021-07-23 2021-08-06',
    '60 others 2021-08-05 2021-08-19',
  ],
};

export async function run(): Promise<void> {
  const { add: entriesToAdd, delete: entriesToDelete } = FIXES;

  await sendDiscordAdminMessage(
    `[${getStage()}] FIXING DB\n` +
      `Adding ${entriesToAdd.length} closure entries\n` +
      `Deleting ${entriesToDelete.length} closure entries`,
  );

  await Promise.all([
    ...entriesToAdd.map((input) => addEntry(input)),
    ...entriesToDelete.map((input) => deleteEntry(input)),
  ]);
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

import { type NEAData } from '../dataCollection';
import { getFromS3, listObjects } from '../ext/aws/s3';
import { sendDiscordAdminMessage } from '../ext/discord';
import { type Closure, getAllClosures, isClosure } from '../models/Closure';
import { getAllHawkerCentres, type HawkerCentre } from '../models/HawkerCentre';
import { prettifyJSON } from '../utils';
import { getStage } from '../utils/stage';
import { run as executeManageDb } from './manageDb';
import { run as executeSeedDb } from './seedDb';

const ARTIFACTS_BUCKET = process.env.ARTIFACTS_BUCKET;

export async function run(): Promise<void> {
  const preResetData = await getPreResetData();

  await executeManageDb('reset');

  await executeSeedDb({ shouldWriteFile: false });

  await findPreAndPostResetDiffs(preResetData);
}

/**
 * Gets the closures/hawkerCentres data saved in S3 prior to re-seeding.
 */
async function getPreResetData() {
  const listObjectsResponse = await listObjects(ARTIFACTS_BUCKET);
  if (listObjectsResponse.isErr) {
    throw listObjectsResponse.value;
  }

  const bucketObjectKeys = listObjectsResponse.value.map((d) => d.Key);
  const closuresObjectKey = bucketObjectKeys.find((key) =>
    key?.startsWith('closures'),
  );
  const hawkerCentresObjectKey = bucketObjectKeys.find((key) =>
    key?.startsWith('hawkerCentres'),
  );
  if (!closuresObjectKey || !hawkerCentresObjectKey) {
    throw new Error(
      `Missing closures object ("${closuresObjectKey}") or hawkerCentres object ("${hawkerCentresObjectKey}")`,
    );
  }

  const getClosuresObjectResponse = await getFromS3(
    ARTIFACTS_BUCKET,
    closuresObjectKey,
  );
  const getHawkerCentresObjectResponse = await getFromS3(
    ARTIFACTS_BUCKET,
    hawkerCentresObjectKey,
  );
  if (getClosuresObjectResponse.isErr) {
    throw getClosuresObjectResponse.value;
  }
  if (getHawkerCentresObjectResponse.isErr) {
    throw getHawkerCentresObjectResponse.value;
  }

  const closures: Closure[] = JSON.parse(getClosuresObjectResponse.value);
  const hawkerCentres: HawkerCentre[] = JSON.parse(
    getHawkerCentresObjectResponse.value,
  );
  return { closures, hawkerCentres };
}

/**
 * Compares the closures/hawkerCentres data before and after DB reset.
 */
async function findPreAndPostResetDiffs(preResetData: NEAData) {
  const getAllClosuresResponse = await getAllClosures();
  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllClosuresResponse.isErr) {
    throw getAllClosuresResponse.value;
  }
  if (getAllHCResponse.isErr) {
    throw getAllHCResponse.value;
  }

  const { closures: closuresBefore, hawkerCentres: hawkerCentresBefore } =
    preResetData;
  const closuresAfter = getAllClosuresResponse.value;
  const hawkerCentresAfter = getAllHCResponse.value;

  const { addedEntries: closuresAdded, deletedEntries: closuresDeleted } =
    findDiffs(closuresBefore, closuresAfter);
  const {
    addedEntries: hawkerCentresAdded,
    deletedEntries: hawkerCentresDeleted,
  } = findDiffs(hawkerCentresBefore, hawkerCentresAfter);

  await sendDiscordAdminMessage([
    `**[${getStage()}]  🔁 SYNC SUMMARY**`,
    `Before: ${closuresBefore.length} closures, ${hawkerCentresBefore.length} hawker centres`,
    `After: ${closuresAfter.length} closures, ${hawkerCentresAfter.length} hawker centres\n`,
    `${closuresAdded.length} closure(s) added`,
    closuresAdded.length > 0 ? prettifyJSON(closuresAdded) : null,
    `${closuresDeleted.length} closure(s) deleted`,
    closuresDeleted.length > 0 ? prettifyJSON(closuresDeleted) : null,
    `${hawkerCentresAdded.length} hawker centre(s) added`,
    hawkerCentresAdded.length > 0 ? prettifyJSON(hawkerCentresAdded) : null,
    `${hawkerCentresDeleted.length} hawker centre(s) deleted`,
    hawkerCentresDeleted.length > 0 ? prettifyJSON(hawkerCentresDeleted) : null,
  ]);
}

// old entry exists in new list: entry not added
// old entry does not exist in new list: entry deleted
function findDiffs<T extends Array<Closure | HawkerCentre>>(
  oldList: T,
  newList: T,
) {
  let addedEntries: Array<Closure | HawkerCentre> = [...newList];
  const deletedEntries: Array<Closure | HawkerCentre> = [];

  const getUniqueId = (entry: Closure | HawkerCentre) =>
    isClosure(entry) ? entry.id : entry.hawkerCentreId;

  oldList.forEach((oldEntry) => {
    const oldEntryUniqueId = getUniqueId(oldEntry);

    const isExistsInNewList = newList.some(
      (newEntry) => oldEntryUniqueId === getUniqueId(newEntry),
    );

    if (isExistsInNewList) {
      addedEntries = addedEntries.filter(
        (entry) => getUniqueId(entry) !== oldEntryUniqueId,
      );
    } else {
      deletedEntries.push(oldEntry);
    }
  });

  return { addedEntries, deletedEntries };
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

import { NEAData } from '../dataCollection';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Closure, getAllClosures, isClosure } from '../models/Closure';
import { getAllHawkerCentres, HawkerCentre } from '../models/HawkerCentre';
import { getStage, prettifyJSON } from '../utils';
import { run as executeFixDb } from './fixDb';
import { run as executeManageDb } from './manageDb';
import { run as executeSeedDb } from './seedDb';

export async function run(): Promise<void> {
  const resetDbResult = await executeManageDb('reset');
  await executeSeedDb({ shouldWriteFile: false });
  await executeFixDb();

  await findPreAndPostResetDiffs(resetDbResult);
}

async function findPreAndPostResetDiffs(resetDbResult: NEAData | null) {
  if (resetDbResult === null) {
    return;
  }

  const getAllClosuresResponse = await getAllClosures();
  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllClosuresResponse.err || getAllHCResponse.err) {
    return;
  }

  const { closures: closuresBefore, hawkerCentres: hawkerCentresBefore } =
    resetDbResult;
  const closuresAfter = getAllClosuresResponse.val;
  const hawkerCentresAfter = getAllHCResponse.val;

  const { addedEntries: closuresAdded, deletedEntries: closuresDeleted } =
    findDiffs(closuresBefore, closuresAfter);
  const {
    addedEntries: hawkerCentresAdded,
    deletedEntries: hawkerCentresDeleted,
  } = findDiffs(hawkerCentresBefore, hawkerCentresAfter);

  const outputMessage =
    `${closuresAdded.length} CLOSURES ADDED\n${prettifyJSON(
      closuresAdded,
    )}\n\n` +
    `${closuresDeleted.length} CLOSURES DELETED\n${prettifyJSON(
      closuresDeleted,
    )}\n\n` +
    `${hawkerCentresAdded.length} HAWKER CENTRES ADDED\n${prettifyJSON(
      hawkerCentresAdded,
    )}\n\n` +
    `${hawkerCentresDeleted.length} HAWKER CENTRES DELETED\n${prettifyJSON(
      hawkerCentresDeleted,
    )}\n\n`;

  try {
    await sendDiscordAdminMessage(
      `[${getStage()}] RESET AND UPDATE SUMMARY\n${outputMessage}`,
    );
  } catch (e) {
    console.info(outputMessage);
  }
}

// old entry exists in new list: entry not added
// old entry does not exist in new list: entry deleted
function findDiffs<T extends (Closure | HawkerCentre)[]>(
  oldList: T,
  newList: T,
) {
  let addedEntries: (Closure | HawkerCentre)[] = [...newList];
  const deletedEntries: (Closure | HawkerCentre)[] = [];

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

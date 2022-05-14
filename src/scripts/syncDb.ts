import { type NEAData } from '../dataCollection';
import { sendDiscordAdminMessage } from '../ext/discord';
import { type Closure, getAllClosures, isClosure } from '../models/Closure';
import { getAllHawkerCentres, type HawkerCentre } from '../models/HawkerCentre';
import { prettifyJSON } from '../utils';
import { getStage } from '../utils/stage';
import { run as executeManageDb } from './manageDb';
import { run as executeSeedDb } from './seedDb';

export async function run(): Promise<void> {
  const resetDbResult = await executeManageDb('reset');
  await executeSeedDb({ shouldWriteFile: false });

  await findPreAndPostResetDiffs(resetDbResult);
}

async function findPreAndPostResetDiffs(resetDbResult: NEAData | null) {
  if (resetDbResult === null) {
    return;
  }

  const getAllClosuresResponse = await getAllClosures();
  const getAllHCResponse = await getAllHawkerCentres();
  if (getAllClosuresResponse.isErr) {
    throw getAllClosuresResponse.value;
  }
  if (getAllHCResponse.isErr) {
    throw getAllHCResponse.value;
  }

  const { closures: closuresBefore, hawkerCentres: hawkerCentresBefore } =
    resetDbResult;
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
    `${closuresAdded.length} closure(s) added`,
    `${prettifyJSON(closuresAdded)}`,
    `${closuresDeleted.length} closure(s) deleted`,
    `${prettifyJSON(closuresDeleted)}`,
    `${hawkerCentresAdded.length} hawker centre(s) added`,
    `${prettifyJSON(hawkerCentresAdded)}`,
    `${hawkerCentresDeleted.length} hawker centre(s) deleted`,
    `${prettifyJSON(hawkerCentresDeleted)}`,
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

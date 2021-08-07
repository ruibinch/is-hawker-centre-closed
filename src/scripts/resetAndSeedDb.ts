import { NEAData } from '../dataCollection';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Closure, isClosure } from '../models/Closure';
import { HawkerCentre } from '../models/HawkerCentre';
import { getStage, prettifyJSON } from '../utils';
import { run as executeManageDb } from './manageDb';
import { run as executeSeedDb } from './seedDb';

export async function run(): Promise<void> {
  const resetDbResult = await executeManageDb('reset');
  const seedDbResult = await executeSeedDb({ shouldWriteFile: false });

  await findResetAndSeedDbDiffs(resetDbResult, seedDbResult);
}

async function findResetAndSeedDbDiffs(
  resetDbResult: NEAData | null,
  seedDbResult: NEAData,
) {
  if (resetDbResult === null) {
    return;
  }

  const { closures: closuresBefore, hawkerCentres: hawkerCentresBefore } =
    resetDbResult;
  const { closures: closuresAfter, hawkerCentres: hawkerCentresAfter } =
    seedDbResult;

  const { addedEntries: closuresAdded, deletedEntries: closuresDeleted } =
    findDiffs(closuresBefore, closuresAfter);
  const {
    addedEntries: hawkerCentresAdded,
    deletedEntries: hawkerCentresDeleted,
  } = findDiffs(hawkerCentresBefore, hawkerCentresAfter);

  const outputMessage =
    `CLOSURES ADDED\n${prettifyJSON(closuresAdded)}\n\n` +
    `CLOSURES DELETED\n${prettifyJSON(closuresDeleted)}\n\n` +
    `HAWKER CENTRES ADDED\n${prettifyJSON(hawkerCentresAdded)}\n\n` +
    `HAWKER CENTRES DELETED\n${prettifyJSON(hawkerCentresDeleted)}\n\n`;

  try {
    await sendDiscordAdminMessage(
      `[${getStage()}] RESET SUMMARY\n${outputMessage}`,
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

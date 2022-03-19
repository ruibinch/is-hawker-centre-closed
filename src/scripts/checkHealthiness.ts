import { sendDiscordAdminMessage } from '../ext/discord';
import { getAllClosures } from '../models/Closure';
import { getAllHawkerCentres } from '../models/HawkerCentre';
import { getStage } from '../utils/stage';

const CLOSURE_TABLE_ENTRIES_HEALTHINESS_THRESHOLD = 400;
const HC_TABLE_ENTRIES_HEALTHINESS_THRESHOLD = 100;

async function checkHealthiness(): Promise<void> {
  const getAllHCResponse = await getAllHawkerCentres();
  const getAllClosuresResponse = await getAllClosures();
  if (getAllHCResponse.isErr) {
    throw getAllHCResponse.value;
  }
  if (getAllClosuresResponse.isErr) {
    throw getAllClosuresResponse.value;
  }

  const numEntriesInClosuresTable = getAllClosuresResponse.value.length;
  const numEntriesInHCTable = getAllHCResponse.value.length;

  const isHealthy =
    numEntriesInClosuresTable >= CLOSURE_TABLE_ENTRIES_HEALTHINESS_THRESHOLD &&
    numEntriesInHCTable >= HC_TABLE_ENTRIES_HEALTHINESS_THRESHOLD;

  await sendDiscordAdminMessage(
    `**[${getStage()}]  🏥 HEALTHINESS CHECK**\n` +
      `${isHealthy ? '✅ PASSED' : '🚨 FAILED'}\n` +
      `Number of closures: ${numEntriesInClosuresTable}\n` +
      `Number of hawker centres: ${numEntriesInHCTable}`,
  );
}

export async function run(): Promise<void> {
  await checkHealthiness();
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

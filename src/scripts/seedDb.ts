import {
  generateClosures,
  generateHawkerCentres,
  getRawRecords,
  writeFile,
} from '../dataCollection';
import {
  generateManualClosures,
  generateManualHawkerCentres,
} from '../dataCollection/manualData';
import { deleteAllObjectsExcept, saveToS3 } from '../ext/aws/s3';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Closure, uploadClosures } from '../models/Closure';
import { HawkerCentre, uploadHawkerCentres } from '../models/HawkerCentre';
import { currentDateInYYYYMMDD } from '../utils/date';
import { getStage } from '../utils/stage';

const CLI_DRY_RUN = process.env['CLI_DRY_RUN'] ?? false;
const ARTIFACTS_BUCKET = process.env.ARTIFACTS_BUCKET;

export async function run(
  props: { shouldWriteFile: boolean } = { shouldWriteFile: true },
): Promise<void> {
  const recordsRaw = await getRawRecords();

  const closuresFromApi = generateClosures(recordsRaw);
  const hawkerCentresFromApi = generateHawkerCentres(recordsRaw);

  const { closuresDedupe, hawkerCentresDedupe } = deduplicateEntries({
    closures: closuresFromApi,
    hawkerCentres: hawkerCentresFromApi,
  });

  const closures = [...closuresDedupe, ...generateManualClosures()];
  const hawkerCentres = [
    ...hawkerCentresDedupe,
    ...generateManualHawkerCentres(),
  ];

  const closuresFilename = `closures-${currentDateInYYYYMMDD()}.json`;
  const hawkerCentresFilename = `hawkerCentres-${currentDateInYYYYMMDD()}.json`;

  await sendDiscordAdminMessage([
    `**[${getStage()}]  🌱 SEEDING DB**`,
    'Data obtained from data.gov.sg API:',
    `1. ${closuresFromApi.length} closures`,
    `2. ${hawkerCentresFromApi.length} hawker centres`,
    'After de-duplication:',
    `1. ${closuresDedupe.length} closures`,
    `2. ${hawkerCentresDedupe.length} hawker centres`,
    'After adding manual entries:',
    `1. ${closures.length} closures`,
    `2. ${hawkerCentres.length} hawker centres`,
  ]);
  if (props.shouldWriteFile) {
    writeFile(closures, closuresFilename);
    writeFile(hawkerCentres, hawkerCentresFilename);
  }

  if (!CLI_DRY_RUN) {
    await uploadClosures(closures);
    await uploadHawkerCentres(hawkerCentres);

    if (getStage() === 'prod') {
      await saveToS3(ARTIFACTS_BUCKET, {
        [closuresFilename]: closures,
        [hawkerCentresFilename]: hawkerCentres,
      });
      // only keep most recent entry
      await deleteAllObjectsExcept(ARTIFACTS_BUCKET, [
        closuresFilename,
        hawkerCentresFilename,
      ]);
    }
  }
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

// Sometimes the data.gov.sg API behaves erratically and returns duplicate hawker centre and closure entries
function deduplicateEntries({
  closures,
  hawkerCentres,
}: {
  closures: Closure[];
  hawkerCentres: HawkerCentre[];
}) {
  const hawkerCentresDedupe: HawkerCentre[] = [];

  [...hawkerCentres]
    .sort((a, b) => a.hawkerCentreId - b.hawkerCentreId)
    .forEach((hawkerCentre) => {
      if (
        // check duplication by hawker centre name
        !hawkerCentresDedupe.map(({ name }) => name).includes(hawkerCentre.name)
      ) {
        hawkerCentresDedupe.push(hawkerCentre);
      }
    });

  const closuresDedupe = closures.filter((closure) =>
    hawkerCentresDedupe
      .map(({ hawkerCentreId }) => hawkerCentreId)
      .includes(closure.hawkerCentreId),
  );

  return { closuresDedupe, hawkerCentresDedupe };
}

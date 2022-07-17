import {
  generateClosures,
  generateHawkerCentres,
  getRawRecords,
  writeFile,
} from '../dataCollection';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Closure, uploadClosures } from '../models/Closure';
import { HawkerCentre, uploadHawkerCentres } from '../models/HawkerCentre';
import { currentDateInYYYYMMDD } from '../utils/date';
import { getStage } from '../utils/stage';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

export async function run(
  props: { shouldWriteFile: boolean } = { shouldWriteFile: true },
): Promise<void> {
  const recordsRaw = await getRawRecords();

  const closures = generateClosures(recordsRaw);
  const hawkerCentres = generateHawkerCentres(recordsRaw);

  const { closuresDedupe, hawkerCentresDedupe } = deduplicateEntries({
    closures,
    hawkerCentres,
  });

  await sendDiscordAdminMessage([
    `**[${getStage()}]  🌱 SEEDING DB**`,
    'Data obtained from data.gov.sg API:',
    `  1. ${closures.length} closures`,
    `  2. ${hawkerCentres.length} hawker centres`,
    'After de-duplication:',
    `  1. ${closuresDedupe.length} closures`,
    `  2. ${hawkerCentresDedupe.length} hawker centres`,
  ]);
  if (props.shouldWriteFile) {
    writeFile(closuresDedupe, `closures-${currentDateInYYYYMMDD()}.json`);
    writeFile(
      hawkerCentresDedupe,
      `hawkerCentres-${currentDateInYYYYMMDD()}.json`,
    );
  }

  if (isUploadToAws !== 'false') {
    await uploadClosures(closuresDedupe);
    await uploadHawkerCentres(hawkerCentresDedupe);
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

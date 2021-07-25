import {
  generateClosures,
  getHawkerCentresList,
  getRawRecords,
  NEAData,
  writeFile,
} from '../dataCollection';
import { sendDiscordAdminMessage } from '../ext/discord';
import { uploadClosures } from '../models/Closure';
import { uploadHawkerCentres } from '../models/HawkerCentre';
import { getStage } from '../utils';
import { currentDateInYYYYMMDD } from '../utils/date';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

export async function run(
  props: { shouldWriteFile: boolean } = { shouldWriteFile: true },
): Promise<NEAData> {
  const getRawRecordsResponse = await getRawRecords();

  const closures = generateClosures(getRawRecordsResponse);
  const hawkerCentres = getHawkerCentresList(closures);

  await sendDiscordAdminMessage(
    `[${getStage()}] SEEDING DB\n${[
      'Data obtained from data.gov.sg API:',
      `1. ${closures.length} closures`,
      `2. ${hawkerCentres.length} hawker centres`,
    ].join('\n')}`,
  );
  if (props.shouldWriteFile) {
    writeFile(closures, `closures-${currentDateInYYYYMMDD()}.json`);
    writeFile(hawkerCentres, `hawkerCentres-${currentDateInYYYYMMDD()}.json`);
  }

  if (isUploadToAws !== 'false') {
    await uploadClosures(closures);
    await uploadHawkerCentres(hawkerCentres);
  }

  return { closures, hawkerCentres };
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

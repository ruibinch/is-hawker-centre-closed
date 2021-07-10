import {
  generateClosures,
  getHawkerCentresList,
  getRawRecords,
  writeFile,
} from '../dataCollection';
import { sendDiscordMessage } from '../ext/discord';
import { uploadClosures } from '../models/Closure';
import { uploadHawkerCentres } from '../models/HawkerCentre';
import { currentDateInYYYYMMDD } from '../utils/date';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

async function run() {
  const getRawRecordsResponse = await getRawRecords();

  const closures = generateClosures(getRawRecordsResponse);
  const hawkerCentres = getHawkerCentresList(closures);

  await sendDiscordMessage(
    `SEEDING DB\n\n${[
      'Data obtained from data.gov.sg API:',
      `1. ${closures.length} closures`,
      `2. ${hawkerCentres.length} hawker centres`,
    ].join('\n')}`,
  );
  writeFile(closures, `closures-${currentDateInYYYYMMDD()}.json`);
  writeFile(hawkerCentres, `hawkerCentres-${currentDateInYYYYMMDD()}.json`);

  if (isUploadToAws !== 'false') {
    await uploadClosures(closures);
    await uploadHawkerCentres(hawkerCentres);
  }

  process.exit(0);
}

run();

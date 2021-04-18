import fs from 'fs';
import { toDateISO8601 } from '../../common/date';
import { uploadData } from '../../common/dynamodb';
import { parseToEnum } from '../../common/enum';
import { ClosureReason, Result } from '../types';
import { generateHash } from '../utils';
import { getRawRecords, parseHawkerCentreName } from './utils';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

getRawRecords().then((recordsRaw) => {
  const results = recordsRaw.reduce((_results: Result[], recordRaw) => {
    const {
      _id: hawkerCentreId,
      name,
      q1_cleaningstartdate,
      q1_cleaningenddate,
      q2_cleaningstartdate,
      q2_cleaningenddate,
      q3_cleaningstartdate,
      q3_cleaningenddate,
      q4_cleaningstartdate,
      q4_cleaningenddate,
      other_works_startdate,
      other_works_enddate,
    } = recordRaw;

    const q1CleaningStartDate = toDateISO8601(q1_cleaningstartdate);
    const q1CleaningEndDate = toDateISO8601(q1_cleaningenddate);
    const q2CleaningStartDate = toDateISO8601(q2_cleaningstartdate);
    const q2CleaningEndDate = toDateISO8601(q2_cleaningenddate);
    const q3CleaningStartDate = toDateISO8601(q3_cleaningstartdate);
    const q3CleaningEndDate = toDateISO8601(q3_cleaningenddate);
    const q4CleaningStartDate = toDateISO8601(q4_cleaningstartdate);
    const q4CleaningEndDate = toDateISO8601(q4_cleaningenddate);
    const otherWorksStartDate = toDateISO8601(other_works_startdate);
    const otherWorksEndDate = toDateISO8601(other_works_enddate);

    [
      [q1CleaningStartDate, q1CleaningEndDate, ClosureReason.cleaning],
      [q2CleaningStartDate, q2CleaningEndDate, ClosureReason.cleaning],
      [q3CleaningStartDate, q3CleaningEndDate, ClosureReason.cleaning],
      [q4CleaningStartDate, q4CleaningEndDate, ClosureReason.cleaning],
      [otherWorksStartDate, otherWorksEndDate, ClosureReason.renovation],
    ].forEach(([startDate, endDate, reason]) => {
      if (startDate && endDate && reason) {
        const closureReason = parseToEnum(ClosureReason, reason);
        if (!closureReason) {
          throw new Error(`${reason} is not a valid ClosureReason enum value.`);
        }

        const result = generateResult({
          hawkerCentreId,
          name,
          startDate,
          endDate,
          reason: closureReason,
        });
        _results.push(result);
      }
    });

    return _results;
  }, []);

  writeFile(results);
  if (isUploadToAws === 'true') {
    console.log(`${results.length} entries found`);
    console.log(`Uploading to AWS`);
    uploadData(results);
  }
});

function generateResult(props: {
  hawkerCentreId: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: ClosureReason;
}): Result {
  const { hawkerCentreId, name, startDate, endDate, reason } = props;

  const id = generateHash(name, reason, startDate, endDate);
  const [namePrimary, nameSecondary] = parseHawkerCentreName(name);

  return {
    id,
    hawkerCentreId,
    name: namePrimary,
    nameSecondary,
    reason,
    startDate,
    endDate,
  };
}

function writeFile(results: Result[]) {
  const filename = 'results.json';
  fs.writeFile(`./data/${filename}`, JSON.stringify(results), (err) => {
    if (err) throw err;
    console.log(`Data successfully written to ${filename}`);
  });
}

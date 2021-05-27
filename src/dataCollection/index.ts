import { uploadHawkerCentres } from '../models/HawkerCentre';
import { uploadResults } from '../models/Result';
import { ClosureReason, HawkerCentre, Result } from '../models/types';
import { currentDateInYYYYMMDD, toDateISO8601 } from '../utils/date';
import { HawkerCentreClosureRecord } from './types';
import {
  generateHash,
  getRawRecords,
  parseHawkerCentreName,
  writeFile,
} from './utils';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

getRawRecords().then((recordsRaw) => {
  const results = generateResults(recordsRaw);

  const hawkerCentres: HawkerCentre[] = getHawkerCentresList(results);

  console.log(`${results.length} results found`);
  console.log(`${hawkerCentres.length} hawker centres found`);
  writeFile(results, `results-${currentDateInYYYYMMDD()}.json`);
  writeFile(hawkerCentres, `hawkerCentres-${currentDateInYYYYMMDD()}.json`);

  if (isUploadToAws !== 'false') {
    uploadResults(results);
    uploadHawkerCentres(hawkerCentres);
  }
});

function generateResults(recordsRaw: HawkerCentreClosureRecord[]): Result[] {
  return recordsRaw.reduce((_results: Result[], recordRaw) => {
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
      [q1CleaningStartDate, q1CleaningEndDate, 'cleaning'],
      [q2CleaningStartDate, q2CleaningEndDate, 'cleaning'],
      [q3CleaningStartDate, q3CleaningEndDate, 'cleaning'],
      [q4CleaningStartDate, q4CleaningEndDate, 'cleaning'],
      [otherWorksStartDate, otherWorksEndDate, 'renovation'],
    ].forEach(([startDate, endDate, reason]) => {
      if (startDate && endDate && reason) {
        const result = generateResult({
          hawkerCentreId,
          name,
          startDate,
          endDate,
          reason: reason as ClosureReason,
        });
        _results.push(result);
      }
    });

    return _results;
  }, []);
}

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

function getHawkerCentresList(results: Result[]) {
  const hawkerCentres = results.map((result) => ({
    hawkerCentreId: result.hawkerCentreId,
    name: result.name,
    nameSecondary: result.nameSecondary,
  }));

  // remove duplicate entries
  const hawkerCentresDeduplicated = hawkerCentres.filter(
    (hc, idx, self) =>
      self.findIndex((hc2) => hc.hawkerCentreId === hc2.hawkerCentreId) === idx,
  );
  return hawkerCentresDeduplicated;
}

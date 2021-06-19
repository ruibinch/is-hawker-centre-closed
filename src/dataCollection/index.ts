import { uploadClosures } from '../models/Closure';
import { uploadHawkerCentres } from '../models/HawkerCentre';
import { ClosureReason, HawkerCentre, Closure } from '../models/types';
import { currentDateInYYYYMMDD } from '../utils/date';
import { HawkerCentreClosureRecord } from './types';
import {
  generateHash,
  getRawRecords,
  parseClosureDate,
  parseHawkerCentreName,
  writeFile,
} from './utils';

const args = process.argv.slice(2);
const [isUploadToAws] = args;

getRawRecords().then(async (recordsRaw) => {
  const closures = generateClosures(recordsRaw);

  const hawkerCentres: HawkerCentre[] = getHawkerCentresList(closures);

  console.log(`${closures.length} closures found`);
  console.log(`${hawkerCentres.length} hawker centres found`);
  writeFile(closures, `closures-${currentDateInYYYYMMDD()}.json`);
  writeFile(hawkerCentres, `hawkerCentres-${currentDateInYYYYMMDD()}.json`);

  if (isUploadToAws !== 'false') {
    await uploadClosures(closures);
    await uploadHawkerCentres(hawkerCentres);
  }
});

function generateClosures(recordsRaw: HawkerCentreClosureRecord[]): Closure[] {
  return recordsRaw.reduce((_closures: Closure[], recordRaw) => {
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

    const q1CleaningStartDate = parseClosureDate(q1_cleaningstartdate);
    const q1CleaningEndDate = parseClosureDate(q1_cleaningenddate);
    const q2CleaningStartDate = parseClosureDate(q2_cleaningstartdate);
    const q2CleaningEndDate = parseClosureDate(q2_cleaningenddate);
    const q3CleaningStartDate = parseClosureDate(q3_cleaningstartdate);
    const q3CleaningEndDate = parseClosureDate(q3_cleaningenddate);
    const q4CleaningStartDate = parseClosureDate(q4_cleaningstartdate);
    const q4CleaningEndDate = parseClosureDate(q4_cleaningenddate);
    const otherWorksStartDate = parseClosureDate(other_works_startdate);
    const otherWorksEndDate = parseClosureDate(other_works_enddate);

    [
      [q1CleaningStartDate, q1CleaningEndDate, 'cleaning'],
      [q2CleaningStartDate, q2CleaningEndDate, 'cleaning'],
      [q3CleaningStartDate, q3CleaningEndDate, 'cleaning'],
      [q4CleaningStartDate, q4CleaningEndDate, 'cleaning'],
      [otherWorksStartDate, otherWorksEndDate, 'others'],
    ].forEach(([startDate, endDate, reason]) => {
      if (startDate && endDate && reason) {
        const closure = generateClosure({
          hawkerCentreId,
          name,
          startDate,
          endDate,
          reason: reason as ClosureReason,
        });
        _closures.push(closure);
      }
    });

    return _closures;
  }, []);
}

function generateClosure(props: {
  hawkerCentreId: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: ClosureReason;
}): Closure {
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

function getHawkerCentresList(closures: Closure[]) {
  const hawkerCentres = closures.map((closure) => ({
    hawkerCentreId: closure.hawkerCentreId,
    name: closure.name,
    nameSecondary: closure.nameSecondary,
  }));

  // remove duplicate entries
  const hawkerCentresDeduplicated = hawkerCentres.filter(
    (hc, idx, self) =>
      self.findIndex((hc2) => hc.hawkerCentreId === hc2.hawkerCentreId) === idx,
  );
  return hawkerCentresDeduplicated;
}

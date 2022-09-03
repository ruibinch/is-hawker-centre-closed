import type { ClosureReason, Closure } from '../models/Closure';
import type { HawkerCentre } from '../models/HawkerCentre';
import hcKeywords from './hcKeywords';
import type { HawkerCentreClosureRecord } from './types';
import {
  generateHash,
  parseClosureDate,
  parseClosureRemarks,
  parseHawkerCentreName,
} from './utils';

export * from './types';
export * from './utils';

export function generateClosures(
  recordsRaw: HawkerCentreClosureRecord[],
): Closure[] {
  return recordsRaw.reduce((_closures: Closure[], recordRaw) => {
    const {
      _id: hawkerCentreId,
      name,
      q1_cleaningstartdate,
      q1_cleaningenddate,
      remarks_q1,
      q2_cleaningstartdate,
      q2_cleaningenddate,
      remarks_q2,
      q3_cleaningstartdate,
      q3_cleaningenddate,
      remarks_q3,
      q4_cleaningstartdate,
      q4_cleaningenddate,
      remarks_q4,
      other_works_startdate,
      other_works_enddate,
      remarks_other_works,
    } = recordRaw;

    const q1CleaningStartDate = parseClosureDate(q1_cleaningstartdate);
    const q1CleaningEndDate = parseClosureDate(q1_cleaningenddate);
    const q1Remarks = parseClosureRemarks(remarks_q1);
    const q2CleaningStartDate = parseClosureDate(q2_cleaningstartdate);
    const q2CleaningEndDate = parseClosureDate(q2_cleaningenddate);
    const q2Remarks = parseClosureRemarks(remarks_q2);
    const q3CleaningStartDate = parseClosureDate(q3_cleaningstartdate);
    const q3CleaningEndDate = parseClosureDate(q3_cleaningenddate);
    const q3Remarks = parseClosureRemarks(remarks_q3);
    const q4CleaningStartDate = parseClosureDate(q4_cleaningstartdate);
    const q4CleaningEndDate = parseClosureDate(q4_cleaningenddate);
    const q4Remarks = parseClosureRemarks(remarks_q4);
    const otherWorksStartDate = parseClosureDate(other_works_startdate);
    const otherWorksEndDate = parseClosureDate(other_works_enddate);
    const otherWorksRemarks = parseClosureRemarks(remarks_other_works);

    [
      ['cleaning', q1CleaningStartDate, q1CleaningEndDate, q1Remarks],
      ['cleaning', q2CleaningStartDate, q2CleaningEndDate, q2Remarks],
      ['cleaning', q3CleaningStartDate, q3CleaningEndDate, q3Remarks],
      ['cleaning', q4CleaningStartDate, q4CleaningEndDate, q4Remarks],
      ['others', otherWorksStartDate, otherWorksEndDate, otherWorksRemarks],
    ].forEach(([reason, startDate, endDate, remarks]) => {
      if (reason && startDate && endDate) {
        const closure = generateClosure({
          hawkerCentreId,
          name,
          startDate,
          endDate,
          reason: reason as ClosureReason,
          remarks,
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
  remarks: string | null;
}): Closure {
  const { hawkerCentreId, name, startDate, endDate, reason, remarks } = props;

  const id = generateHash(
    hawkerCentreId.toString(),
    reason,
    startDate,
    endDate,
  );
  const [namePrimary, nameSecondary] = parseHawkerCentreName(name);
  const keywords = hcKeywords[namePrimary];

  return {
    id,
    hawkerCentreId,
    name: namePrimary,
    nameSecondary,
    keywords,
    reason,
    startDate,
    endDate,
    remarks,
  };
}

export function generateHawkerCentres(
  recordsRaw: HawkerCentreClosureRecord[],
): HawkerCentre[] {
  return recordsRaw
    .filter(({ status }) => status !== 'Under Construction')
    .map((recordRaw) => {
      const { _id: hawkerCentreId, address_myenv: address, name } = recordRaw;

      const [namePrimary, nameSecondary] = parseHawkerCentreName(name);
      const keywords = hcKeywords[namePrimary];

      return {
        hawkerCentreId,
        address,
        name: namePrimary,
        nameSecondary,
        keywords,
      };
    });
}

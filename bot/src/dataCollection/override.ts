import { HawkerCentreClosureRecord } from './types';

type OverrideInfo = {
  id: number;
  attributeName: keyof HawkerCentreClosureRecord;
  newValue: string;
};

const OVERRIDES: OverrideInfo[] = [
  {
    id: 104,
    attributeName: 'other_works_startdate',
    newValue: '1/3/2021',
  },
];

/**
 * Performs a manual override of some records.
 * Used when the API returns incorrect/old data.
 */
export function overrideRecords(
  records: HawkerCentreClosureRecord[],
): HawkerCentreClosureRecord[] {
  let recordsUpdated = [...records];

  OVERRIDES.forEach((overrideInfo) => {
    const { id, attributeName, newValue } = overrideInfo;

    const record = findRecordById(records, id);
    if (record) {
      const recordUpdated = {
        ...record,
        [attributeName]: newValue,
      };

      recordsUpdated = generateUpdatedRecords(
        recordsUpdated,
        id,
        recordUpdated,
      );
    }
  });

  return recordsUpdated;
}

/**
 * Finds a record by the `_id` attribute.
 */
function findRecordById(
  records: HawkerCentreClosureRecord[],
  id: number,
): HawkerCentreClosureRecord | undefined {
  return records.find((record) => record._id === id);
}

/**
 * Combines the updated record with the existing records.
 */
function generateUpdatedRecords(
  records: HawkerCentreClosureRecord[],
  id: number,
  recordUpdated: HawkerCentreClosureRecord,
): HawkerCentreClosureRecord[] {
  return [...records.filter((_record) => _record._id !== id), recordUpdated];
}

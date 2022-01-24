import type { HawkerCentreClosureRecord } from './types';

type OverrideInfo = {
  id: number;
  attributeName: keyof HawkerCentreClosureRecord;
  newValue: string;
};

const OVERRIDES: OverrideInfo[] = [
  {
    id: 74,
    attributeName: 'name',
    newValue: 'New Upper Changi Road Blk 208B (Bedok Interchange Food Centre)',
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

import { DataGovSgResponse, Record } from './types';

/**
 * Performs a manual override of some data points.
 * Used when the API returns incorrect/old data.
 */
export function overrideData(data: DataGovSgResponse): DataGovSgResponse {
  const dataUpdated = overrideSingleRecord({
    data,
    id: 104,
    overrides: [
      {
        attributeName: 'other_works_startdate',
        newValue: '1/3/2021',
      },
    ],
  });

  return dataUpdated;
}

function overrideSingleRecord(props: {
  data: DataGovSgResponse;
  id: number;
  overrides: Array<{
    attributeName: string;
    newValue: string;
  }>;
}): DataGovSgResponse {
  const { data, id, overrides } = props;

  const record = findRecordById(data, 104);
  if (!record) {
    return data;
  }

  overrides.forEach((override) => {
    const { attributeName, newValue } = override;
    record[attributeName] = newValue;
  });

  const recordsUpdated = generateUpdatedRecords(data, id, record);
  return {
    ...data,
    result: {
      ...data.result,
      records: recordsUpdated,
    },
  };
}

/**
 * Finds a record by the `_id` attribute.
 */
function findRecordById(
  data: DataGovSgResponse,
  id: number,
): Record | undefined {
  const { records } = data.result;
  return records.find((record) => record._id === id);
}

/**
 * Combines the updated record with the existing unchanged records.
 */
function generateUpdatedRecords(
  data: DataGovSgResponse,
  id: number,
  record: Record,
): Record[] {
  const { records } = data.result;
  const recordsUnchanged = records.filter((_record) => _record._id !== id);
  return [...recordsUnchanged, record];
}

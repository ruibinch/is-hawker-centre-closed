import axios from 'axios';
import fs from 'fs';

import { overrideData } from './override';
import {
  HawkerCentreClosureResponse,
  HawkerCentreClosureRecord,
} from './types';

export async function getRawRecords(): Promise<HawkerCentreClosureRecord[]> {
  return axios
    .get('https://data.gov.sg/api/action/datastore_search', {
      params: {
        resource_id: 'b80cb643-a732-480d-86b5-e03957bc82aa',
        limit: 200,
      },
    })
    .then((response) => {
      const data = response.data as HawkerCentreClosureResponse;
      const dataUpdated = overrideData(data);

      return dataUpdated.result.records.map((record) => ({
        _id: record._id,
        name: record.name,
        address_myenv: record.address_myenv,
        q1_cleaningstartdate: record.q1_cleaningstartdate,
        q1_cleaningenddate: record.q1_cleaningenddate,
        q2_cleaningstartdate: record.q2_cleaningstartdate,
        q2_cleaningenddate: record.q2_cleaningenddate,
        q3_cleaningstartdate: record.q3_cleaningstartdate,
        q3_cleaningenddate: record.q3_cleaningenddate,
        q4_cleaningstartdate: record.q4_cleaningstartdate,
        q4_cleaningenddate: record.q4_cleaningenddate,
        other_works_startdate: record.other_works_startdate,
        other_works_enddate: record.other_works_enddate,
        remarks_other_works: record.remarks_other_works,
      }));
    });
}

/**
 * Extracts the secondary representation of the hawker centre name, if applicable,
 * i.e. the text within a pair of brackets.
 */
export function parseHawkerCentreName(
  name: string,
): [string, string | undefined] {
  const regexTextInBrackets = /\(.*\)/g;
  let nameSecondary: string | undefined;

  // remove text within brackets along with enclosing brackets
  const namePrimary = name.replace(regexTextInBrackets, '').trim();

  const matchesSecondary = regexTextInBrackets.exec(name);
  if (matchesSecondary) {
    // remove enclosing brackets
    nameSecondary = matchesSecondary[0].replace(/[\\(\\)]/g, '');
  }

  return [namePrimary, nameSecondary];
}

export function writeFile(results: unknown[], filename: string): void {
  fs.writeFile(`./data/${filename}`, JSON.stringify(results), (err) => {
    if (err) throw err;
    console.log(`Data successfully written to ${filename}`);
  });
}

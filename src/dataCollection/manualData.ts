/**
 * To fill in any missing gaps from the data.gov.sg API response.
 */

import { Closure } from '../models/Closure';
import { HawkerCentre } from '../models/HawkerCentre';
import { HackyDate } from '../utils/date';
import { generateHash } from './utils';

const seahImHc: HawkerCentre = {
  hawkerCentreId: 999,
  address: '2, Seah Im Rd, Singapore 099114',
  keywords: ['harbourfront', 'vivo', 'vivocity', 'pasir panjang', 'sentosa'],
  name: 'Seah Im Food Centre',
};
const tanglinHaltHc: HawkerCentre = {
  hawkerCentreId: 998,
  address: 'Blk 1A/ 2A/ 3A, Commonwealth Drive, Singapore 140001/140002/140003',
  keywords: ['tanglin halt'],
  name: 'Commonwealth Drive Blk 1A/2A/3A',
};

export function generateManualClosures(): Closure[] {
  const seahImClosure = (() => {
    const reason = 'others' as const;
    const startDate = '2022-09-01';
    const endDate = '2023-02-28';

    return {
      // prettier-ignore
      id: generateHash(seahImHc.hawkerCentreId.toString(), reason, startDate, endDate),
      hawkerCentreId: seahImHc.hawkerCentreId,
      name: seahImHc.name,
      nameSecondary: seahImHc.nameSecondary,
      keywords: seahImHc.keywords,
      reason,
      startDate,
      endDate,
      remarks: 'Major upgrading works',
    };
  })();

  const tanglinHaltClosure = (() => {
    const reason = 'others' as const;
    const startDate = HackyDate.PERMANENTLY_CLOSED_DATE;
    const endDate = HackyDate.PERMANENTLY_CLOSED_DATE;

    return {
      // prettier-ignore
      id: generateHash(tanglinHaltHc.hawkerCentreId.toString(), reason, startDate, endDate),
      hawkerCentreId: tanglinHaltHc.hawkerCentreId,
      name: tanglinHaltHc.name,
      nameSecondary: tanglinHaltHc.nameSecondary,
      keywords: tanglinHaltHc.keywords,
      reason,
      startDate,
      endDate,
      remarks: 'Closed due to Tanglin Halt SERS project',
    };
  })();

  return [seahImClosure, tanglinHaltClosure];
}

export function generateManualHawkerCentres(): HawkerCentre[] {
  return [seahImHc, tanglinHaltHc];
}

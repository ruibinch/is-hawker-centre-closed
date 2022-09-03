/**
 * To fill in any missing gaps from the data.gov.sg API response.
 */

import { Closure } from '../models/Closure';
import { HawkerCentre } from '../models/HawkerCentre';
import { generateHash } from './utils';

const seahImHc = {
  hawkerCentreId: 999,
  address: '2, Seah Im Rd, Singapore 099114',
  keywords: ['harbourfront', 'vivo', 'vivocity', 'pasir panjang', 'sentosa'],
  name: 'Seah Im Food Centre',
};

export function generateManualClosures(): Closure[] {
  const seahImClosure = (() => {
    const remarks = 'Major upgrading works';
    const reason = 'others' as const;
    const startDate = '2022-09-01';
    const endDate = '2023-02-28';
    const id = generateHash(
      seahImHc.hawkerCentreId.toString(),
      reason,
      startDate,
      endDate,
    );

    return {
      id,
      hawkerCentreId: seahImHc.hawkerCentreId,
      name: seahImHc.name,
      keywords: seahImHc.keywords,
      reason,
      startDate,
      endDate,
      remarks,
    };
  })();

  return [seahImClosure];
}

export function generateManualHawkerCentres(): HawkerCentre[] {
  return [seahImHc];
}

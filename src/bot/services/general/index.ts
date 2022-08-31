import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../types';
import { getLatestUpdates } from './updates';
import { getWeatherReport } from './weather';

export async function manageGeneral(s: string): Promise<ServiceResponse> {
  const text = s.toLowerCase();

  if (text === '/updates') {
    return getLatestUpdates();
  }
  if (text === '/weather' || text === 'weather') {
    return getWeatherReport();
  }

  return Result.Err();
}

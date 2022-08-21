import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../types';
import { getLatestUpdates } from './updates';
import { getWeatherReport } from './weather';

export async function manageGeneral(text: string): Promise<ServiceResponse> {
  if (text === '/updates') {
    return getLatestUpdates();
  }
  /* istanbul ignore next */
  if (text === '/weather') {
    return getWeatherReport();
  }

  return Result.Err();
}

import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../types';
import { getLatestUpdates } from './updates';

export async function manageGeneral(text: string): Promise<ServiceResponse> {
  if (text === '/updates') {
    return getLatestUpdates();
  }

  return Result.Err();
}

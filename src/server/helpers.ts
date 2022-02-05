import { Input } from '../models/Input';
import { User } from '../models/User';
import { BaseQueryParams } from './types';

export function paginateResults<T extends Input | User>(
  results: T[],
  params: BaseQueryParams,
): T[] {
  const page = params.page ?? 1;
  const size = params.size ?? 50;

  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  return results.slice(startIndex, endIndex);
}

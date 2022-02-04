import { Input } from '../models/Input';
import { BaseQueryParams } from './types';

export function paginateResults<T extends Input>(
  results: T[],
  params: BaseQueryParams,
): T[] {
  const page = params.page ?? 1;
  const size = params.size ?? 50;

  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  return results.slice(startIndex, endIndex);
}

export function sortInputsByMostRecent(inputs: Input[]) {
  return [...inputs].sort((a, b) => {
    // inputId is of format `{{userId}}-{{unixTime}}`
    const aTime = Number(a.inputId.split('-')[1]);
    const bTime = Number(b.inputId.split('-')[1]);
    return bTime - aTime;
  });
}

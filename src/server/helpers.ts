import { Input } from '../models/Input';

export function sortInputsByMostRecent(inputs: Input[]) {
  return [...inputs].sort((a, b) => {
    // inputId is of format `{{userId}}-{{unixTime}}`
    const aTime = Number(a.inputId.split('-')[1]);
    const bTime = Number(b.inputId.split('-')[1]);
    return bTime - aTime;
  });
}

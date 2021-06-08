import { t } from '../lang';
import { formatDateDisplay } from '../utils/date';

export function makeClosurePeriodSnippet(
  startDate: string,
  endDate: string,
): string {
  if (startDate === endDate) {
    return formatDateDisplay(startDate, true);
  }

  return t('common.time.time-period', {
    startDate: formatDateDisplay(startDate, true),
    endDate: formatDateDisplay(endDate, true),
  });
}

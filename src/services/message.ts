import { t } from '../lang';
import { ClosureReason } from '../models/Closure';
import { formatDateDisplay } from '../utils/date';

export function makeGenericErrorMessage(): string {
  return t('validation.error.generic');
}

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

export function makeClosureReasonSnippet(
  reason: ClosureReason | undefined,
): string {
  switch (reason) {
    case 'others':
      return t('common.hc-item.closure-reason', {
        reason: t('common.closure-reason.others'),
      });
    default:
      return '';
  }
}

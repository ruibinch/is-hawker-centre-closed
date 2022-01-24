import { t } from '../lang';
import type { Closure, ClosureReason } from '../models/Closure';
import { formatDateDisplay, isIndefiniteEndDate } from '../utils/date';

export function makeGenericErrorMessage(): string {
  return t('validation.error.generic');
}

export function makeClosureListItem(closure: Closure): string {
  return t('common.hc-item', {
    hcName: makeHawkerCentreName(closure.name, closure.nameSecondary),
    closurePeriod: makeClosurePeriodSnippet(closure.startDate, closure.endDate),
    closureReason: makeClosureReasonSnippet(closure.reason),
  });
}

export function makeHawkerCentreName(
  name: string,
  nameSecondary: string | undefined,
  shouldEscapeBrackets = true,
): string {
  const bracketOpening = `${shouldEscapeBrackets ? '\\' : ''}(`;
  const bracketClosing = `${shouldEscapeBrackets ? '\\' : ''})`;

  return `${name}${
    nameSecondary ? ` ${bracketOpening}${nameSecondary}${bracketClosing}` : ''
  }`;
}

export function makeClosurePeriodSnippet(
  startDate: string,
  endDate: string,
): string {
  if (isIndefiniteEndDate(endDate)) {
    return t('common.time.time-period.indefinite-end-date', {
      startDate: formatDateDisplay(startDate, true),
    });
  }

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
        reason: t(`common.closure-reason.others`),
      });
    case 'deepCleaning':
      return t('common.hc-item.closure-reason', {
        reason: t(`common.closure-reason.deep-cleaning`),
      });
    default:
      return '';
  }
}

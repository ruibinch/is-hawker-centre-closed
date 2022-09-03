import type { Closure, ClosureReason } from '../../models/Closure';
import { escapeCharacters } from '../../telegram';
import { isIndefiniteEndDate } from '../../utils/date';
import { t } from '../lang';
import { formatDateDisplay } from './helpers';

export function makeGenericErrorMessage(): string {
  return t('validation.error.generic');
}

export function makeClosureListItem(closure: Closure, index?: number): string {
  return t(
    index !== undefined
      ? 'common.hc-item.with-index'
      : 'common.hc-item.without-index',
    {
      index,
      hcName: makeHawkerCentreName(closure.name, closure.nameSecondary),
      closurePeriod: makeClosurePeriodSnippet(
        closure.startDate,
        closure.endDate,
      ),
      closureReason: makeClosureReasonSnippet(closure.reason, closure.remarks),
    },
  );
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

// "remarks" takes priority if defined; it should be displayed on a new line
export function makeClosureReasonSnippet(
  reason: ClosureReason | undefined,
  remarks: string | null | undefined,
): string {
  if (remarks) {
    return `\n${escapeCharacters(remarks)}`;
  }

  switch (reason) {
    case 'others':
      return t('common.hc-item.closure-reason', {
        reason: t(`common.closure-reason.others`),
      });
    default:
      return '';
  }
}

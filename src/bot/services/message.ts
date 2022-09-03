import type { ClosurePartial, ClosureReason } from '../../models/Closure';
import { escapeCharacters } from '../../telegram';
import { isIndefiniteEndDate } from '../../utils/date';
import { t } from '../lang';
import { formatDateDisplay } from './helpers';

export function makeGenericErrorMessage(): string {
  return t('validation.error.generic');
}

export function makeClosureListItem(
  closure: ClosurePartial,
  index?: number,
): string {
  const { name, nameSecondary, startDate, endDate, reason, remarks } = closure;

  const [indexString, closurePeriodString, closureReasonString] =
    index !== undefined
      ? [
          'common.hc-item.with-index',
          'common.hc-item.closure-period.indented',
          'common.hc-item.closure-reason.indented',
        ]
      : [
          'common.hc-item.without-index',
          'common.hc-item.closure-period',
          'common.hc-item.closure-reason',
        ];

  return t(indexString, {
    index,
    hcName: makeHawkerCentreName(name, nameSecondary),
    closurePeriod: (() => {
      const closurePeriod = makeClosurePeriodSnippet(startDate, endDate);
      return closurePeriod ? t(closurePeriodString, { closurePeriod }) : '';
    })(),
    closureReason: (() => {
      const closureReason = makeClosureReasonSnippet(reason, remarks);
      return closureReason ? t(closureReasonString, { closureReason }) : '';
    })(),
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
  startDate: string | undefined,
  endDate: string | undefined,
): string {
  if (!startDate || !endDate) return '';

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
    return escapeCharacters(remarks);
  }

  switch (reason) {
    case 'others':
      return t('common.closure-reason.others');
    default:
      return '';
  }
}

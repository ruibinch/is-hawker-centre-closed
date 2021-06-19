import { t } from '../../lang';
import { ClosureReason, Closure } from '../../models/types';
import { makeClosurePeriodSnippet } from '../message';

export function makeNotificationMessage(closures: Closure[]): string {
  let reply = t(
    closures.length === 1
      ? 'notifications.overview.singular'
      : 'notifications.overview.plural',
    {
      emoji: '\u{1F4A1}',
      numHC: closures.length,
    },
  );

  const closuresInText = closures.map((closure) =>
    t('common.hc-item', {
      hcName: closure.name,
      closurePeriod: makeClosurePeriodSnippet(
        closure.startDate,
        closure.endDate,
      ),
      closureReason: makeClosureReasonSnippet(closure.reason),
    }),
  );

  reply += closuresInText.join('\n\n');
  return reply;
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case 'others':
      return t('notifications.snippet.closure-reason', {
        reason: t('common.closure-reason.others'),
      });
    default:
      return '';
  }
}

import { t } from '../../lang';
import { Closure } from '../../models/Closure';
import { makeClosurePeriodSnippet, makeClosureReasonSnippet } from '../message';

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

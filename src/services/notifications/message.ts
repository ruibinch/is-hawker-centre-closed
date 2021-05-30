import { t } from '../../lang';
import { ClosureReason, Closure } from '../../models/types';
import { formatDateDisplay } from '../../utils/date';

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
    t('notifications.item', {
      hcName: closure.name,
      startDate: formatDateDisplay(closure.startDate, true),
      endDate: formatDateDisplay(closure.endDate, true),
      closureReason: makeClosureReasonSnippet(closure.reason),
    }),
  );

  reply += closuresInText.join('\n\n');
  return reply;
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case 'renovation':
      return t('notifications.snippet.closure-reason', {
        reason: t('common.closure-reason.renovation'),
      });
    default:
      return '';
  }
}

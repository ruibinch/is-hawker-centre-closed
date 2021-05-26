import { t } from '../../lang';
import { ClosureReason, Result } from '../../models/types';
import { formatDateDisplay } from '../../utils/date';

export function makeNotificationMessage(results: Result[]): string {
  let reply = t(
    results.length === 1
      ? 'notifications.overview.singular'
      : 'notifications.overview.plural',
    {
      emoji: '\u{1F4A1}',
      numHC: results.length,
    },
  );

  const resultsInText = results.map((result) =>
    t('notifications.item', {
      hcName: result.name,
      startDate: formatDateDisplay(result.startDate, true),
      endDate: formatDateDisplay(result.endDate, true),
      closureReasonSnippet: makeClosureReasonSnippet(result.reason),
    }),
  );

  reply += resultsInText.join('\n\n');
  return reply;
}

function makeClosureReasonSnippet(reason: ClosureReason) {
  switch (reason) {
    case ClosureReason.renovation:
      return t(
        'notifications.snippet.closure-reason.long-term-renovation-works',
      );
    default:
      return '';
  }
}

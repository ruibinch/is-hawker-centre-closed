import { t } from '../../../lang';
import type { Closure } from '../../../models/Closure';
import { makeClosureListItem } from '../message';

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
    makeClosureListItem(closure),
  );

  reply += closuresInText.join('\n\n');
  return reply;
}

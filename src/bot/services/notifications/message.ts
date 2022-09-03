import type { Closure } from '../../../models/Closure';
import { t } from '../../lang';
import { makeClosureListItem } from '../message';

export function makeNotificationMessage(closures: Closure[]): string {
  const header = t(
    closures.length === 1
      ? 'notifications.overview.singular'
      : 'notifications.overview.plural',
    {
      emoji: '\u{1F4A1}',
      numHC: closures.length,
    },
  );
  const closuresList = closures
    .map((closure) => makeClosureListItem(closure))
    .join('\n\n');

  return `${header}${closuresList}`;
}

import { parseToEnum } from '../common/enum';
import { ExtractSearchModifierResult, SearchModifier } from './types';

const SEARCH_MODIFIERS = ['today', 'month', 'next month', 'tmr', 'tomorrow'];

export function extractSearchModifier(
  term: string,
): ExtractSearchModifierResult {
  const modifierRegex = new RegExp(`(${SEARCH_MODIFIERS.join('|')})$`);

  // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
  const matches = modifierRegex.exec(term.toLowerCase());
  if (matches === null) return undefined;

  const modifier = parseModifier(matches[0]);
  const searchModifier = parseToEnum(SearchModifier, modifier);
  if (!searchModifier) return undefined;

  const result: ExtractSearchModifierResult = {
    modifier: searchModifier,
    index: matches.index,
  };
  return result;
}

/**
 * Parses the modifier into an appropriate format for parsing to the SearchModifier enum type.
 */
function parseModifier(s: string): string {
  const str = s.trim();

  switch (str) {
    case 'next month':
      return 'nextMonth';
    case 'tmr':
      return 'tomorrow';
    default:
      return str;
  }
}

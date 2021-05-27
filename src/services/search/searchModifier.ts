import { ExtractSearchModifierResult, SearchModifier } from './types';

// List of accepted search modifiers
const SEARCH_MODIFIERS = ['today', 'month', 'next month', 'tmr', 'tomorrow'];

export function extractSearchModifier(
  term: string,
): ExtractSearchModifierResult {
  const modifierRegex = new RegExp(`(${SEARCH_MODIFIERS.join('|')})$`);

  // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
  const matches = modifierRegex.exec(term.toLowerCase());
  if (matches === null) return undefined;

  const searchModifier = parseSearchModifier(matches[0]);
  if (!searchModifier) return undefined;

  const result: ExtractSearchModifierResult = {
    modifier: searchModifier,
    index: matches.index,
  };
  return result;
}

/**
 * Parses the modifier into a string of type SearchModifier.
 * Returns undefined if the input string is invalid.
 */
function parseSearchModifier(s: string): SearchModifier | undefined {
  const str = s.trim();

  switch (str) {
    case 'next month':
      return 'nextMonth';
    case 'tmr':
      return 'tomorrow';
    case 'today':
    case 'tomorrow':
    case 'month':
      return str;
    default:
      return undefined;
  }
}

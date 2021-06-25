import { Err, Ok, Result } from 'ts-results';

import { ExtractSearchModifierResult, SearchModifier } from './types';

// List of accepted search modifiers
const SEARCH_MODIFIERS = [
  'today',
  'month',
  'next month',
  'tmr',
  'tomorrow',
  '\\snext', // "next" cannot be a standalone modifier
];

export function isSearchModifierTimeBased(modifier: SearchModifier): boolean {
  return modifier !== 'next';
}

export function extractSearchModifier(
  term: string,
): Result<ExtractSearchModifierResult, void> {
  const modifierRegex = new RegExp(`(${SEARCH_MODIFIERS.join('|')})$`);

  // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
  const matches = modifierRegex.exec(term.toLowerCase());
  if (matches === null) return Err.EMPTY;

  const searchModifier = parseSearchModifier(matches[0]);
  if (!searchModifier) return Err.EMPTY;

  return Ok({
    modifier: searchModifier,
    index: matches.index,
  });
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
    case 'next':
      return str;
    /* istanbul ignore next */
    default:
      return undefined;
  }
}

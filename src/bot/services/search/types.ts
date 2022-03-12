import type { Closure } from '../../../models/Closure';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = {
  params: SearchObject;
  hasResults: boolean;
  closures: Closure[];
};

export type SearchModifier =
  | 'today'
  | 'tomorrow'
  | 'nextWeek'
  | 'month'
  | 'nextMonth'
  | 'next';

export type ExtractSearchModifierResult = {
  modifier: SearchModifier;
  index: number;
};

export type SearchObject = {
  keyword: string;
  modifier: SearchModifier;
};

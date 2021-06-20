import { Closure } from '../../models/Closure';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = {
  params: SearchObject;
  closures: Closure[];
};

export type SearchModifier = 'today' | 'tomorrow' | 'month' | 'nextMonth';

export type ExtractSearchModifierResult = {
  modifier: SearchModifier;
  index: number;
};

export type SearchObject = {
  keyword: string;
  modifier: SearchModifier;
};

import { Result } from '../../models/types';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = {
  params: SearchObject;
  isDataPresent?: boolean;
  results: Result[];
};

export type SearchModifier = 'today' | 'tomorrow' | 'month' | 'nextMonth';

export type ExtractSearchModifierResult =
  | {
      modifier: SearchModifier;
      index: number;
    }
  | undefined;

export type SearchObject = {
  keyword: string;
  modifier: SearchModifier;
};

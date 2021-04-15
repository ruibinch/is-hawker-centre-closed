import { Result } from '../parser/types';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = {
  params: SearchObject;
  results: Result[];
};

export enum SearchModifier {
  today = 'today',
  month = 'month',
}

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

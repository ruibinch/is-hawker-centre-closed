import { Result } from '../dataCollection/types';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = {
  params: SearchObject;
  isDataPresent?: boolean;
  results: Result[];
};

export enum SearchModifier {
  today = 'today',
  tomorrow = 'tomorrow',
  month = 'month',
  nextMonth = 'nextMonth',
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

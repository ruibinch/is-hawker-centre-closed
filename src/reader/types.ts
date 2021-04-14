import { Result } from '../parser/types';

export type ResponseBody = {
  statusCode: number;
  body: string;
};

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

export type SearchObject = {
  keyword: string;
  modifier: SearchModifier;
};

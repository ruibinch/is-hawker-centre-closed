export type Query = {
  term: string;
};

export enum SearchModifier {
  today = 'today',
  month = 'month',
}

export type SearchObject = {
  keyword: string;
  modifier?: SearchModifier;
};

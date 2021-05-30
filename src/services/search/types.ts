import { Result } from '../../models/types';
import { BaseResponse } from '../../utils/types';

export type SearchQuery = {
  term: string;
};

export type SearchResponse = BaseResponse &
  (
    | {
        success: true;
        params: SearchObject;
        results: Result[];
      }
    | {
        success: false;
      }
  );

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

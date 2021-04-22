import { HawkerCentreInfo } from '../../common/types';

export type FindHCByKeywordResponse = {
  isExactMatch?: boolean;
  isFindError?: boolean;
  hawkerCentres: HawkerCentreInfo[];
};

import { HawkerCentreInfo } from '../../models/types';

export type FindHCResponse = {
  isExactMatch?: boolean;
  isFindError?: boolean;
  hawkerCentres: HawkerCentreInfo[];
};

export type AddHCResponse = {
  success: boolean;
  isDuplicate?: boolean;
};

// TODO: use discriminated union type
export type DeleteHCResponse = {
  success: boolean;
  hawkerCentre?: HawkerCentreInfo;
  numFavourites?: number;
};

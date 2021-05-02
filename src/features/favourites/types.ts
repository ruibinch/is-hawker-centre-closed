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

export type DeleteHCResponse = {
  success: boolean;
  hawkerCentre?: HawkerCentreInfo;
  numFavourites?: number;
};

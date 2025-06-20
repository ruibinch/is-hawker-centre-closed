import type { ClosurePartial } from '../../../models/Closure';
import type { HawkerCentre } from '../../../models/HawkerCentre';

export type FindHCResponse = {
  isExactMatch?: boolean;
  isFindError?: boolean;
  hawkerCentres: HawkerCentre[];
};

export type AddHCResponse = {
  isDuplicate?: boolean;
};

export type DeleteHCResponseOk = {
  hawkerCentre: HawkerCentre;
};

export type DeleteHCResponseError = {
  numFavourites: number;
};

export type GetUserFavsWithClosuresResponse = {
  closures: ClosurePartial[];
};

export type IsUserInFavModeResponse = {
  isInFavouritesMode?: boolean;
};

export type ManageNotificationsResponse =
  | {
      operation: 'read';
      currentValue: boolean | undefined;
    }
  | {
      operation: 'write';
      newValue: boolean | undefined;
    };

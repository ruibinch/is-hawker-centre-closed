import { HawkerCentreInfo } from '../../models/types';
import { BotResponse } from '../../utils/types';

export type FindHCResponse = {
  isExactMatch?: boolean;
  isFindError?: boolean;
  hawkerCentres: HawkerCentreInfo[];
};

export type AddHCResponse = {
  success: boolean;
  isDuplicate?: boolean;
};

export type DeleteHCResponse =
  | {
      success: true;
      hawkerCentre: HawkerCentreInfo;
    }
  | {
      success: false;
      numFavourites: number;
    };

export type HandleFavouriteSelectionResponse =
  | {
      success: true;
      response: BotResponse;
    }
  | {
      success: false;
    };

export type IsUserInFavModeResponse = {
  success: boolean;
  isInFavouritesMode?: boolean;
};

export type ToggleUserInFavModeResponse = {
  success: true;
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

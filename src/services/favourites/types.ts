import { HawkerCentre, ClosurePartial } from '../../models/types';
import { BaseResponse, BotResponse } from '../../utils/types';

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

export type DeleteHCResponseError =
  | {
      isError: false;
      numFavourites: number;
    }
  | {
      isError: true;
    };

export type GetUserFavsWithClosuresResponse = {
  closures: ClosurePartial[];
};

export type HandleFavouriteSelectionResponse = BaseResponse &
  (
    | {
        success: true;
        response: BotResponse;
      }
    | {
        success: false;
      }
  );

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

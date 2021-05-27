import { HawkerCentre, ResultPartial } from '../../models/types';
import { BaseResponse, BotResponse } from '../../utils/types';

export type FindHCResponse = BaseResponse &
  (
    | {
        success: true;
        isExactMatch?: boolean;
        isFindError?: boolean;
        hawkerCentres: HawkerCentre[];
      }
    | {
        success: false;
      }
  );

export type AddHCResponse = BaseResponse & {
  isDuplicate?: boolean;
};

export type DeleteHCResponse = BaseResponse &
  (
    | {
        success: true;
        hawkerCentre: HawkerCentre;
      }
    | ({
        success: false;
      } & (
        | {
            isError: false;
            numFavourites: number;
          }
        | {
            isError: true;
          }
      ))
  );

export type GetUserFavsWithResultsResponse = BaseResponse &
  (
    | {
        success: true;
        results: ResultPartial[];
      }
    | {
        success: false;
      }
  );

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

export type IsUserInFavModeResponse = BaseResponse & {
  isInFavouritesMode?: boolean;
};

export type ToggleUserInFavModeResponse = BaseResponse;

export type ManageNotificationsResponse =
  | {
      operation: 'read';
      currentValue: boolean | undefined;
    }
  | {
      operation: 'write';
      newValue: boolean | undefined;
    };

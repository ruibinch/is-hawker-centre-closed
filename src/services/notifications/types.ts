import { Result } from '../../models/types';
import { BaseResponse } from '../../utils/types';

export type UserWithResult = {
  userId: number;
  results: Result[];
};

export type GetUsersWithFavsClosedTodayResponse = BaseResponse &
  (
    | {
        success: true;
        output: UserWithResult[];
      }
    | { success: false }
  );

export type NotificationMessage = {
  userId: number;
  message: string;
};

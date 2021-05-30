import { Closure } from '../../models/types';
import { BaseResponse } from '../../utils/types';

export type UserWithClosure = {
  userId: number;
  closures: Closure[];
};

export type GetUsersWithFavsClosedTodayResponse = BaseResponse &
  (
    | {
        success: true;
        output: UserWithClosure[];
      }
    | { success: false }
  );

export type NotificationMessage = {
  userId: number;
  message: string;
};

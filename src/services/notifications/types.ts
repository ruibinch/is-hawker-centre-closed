import { Closure } from '../../models/types';

export type UserWithClosure = {
  userId: number;
  closures: Closure[];
};

export type NotificationMessage = {
  userId: number;
  message: string;
};

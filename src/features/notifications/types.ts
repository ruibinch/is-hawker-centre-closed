import { Result } from '../../models/types';

export type UserWithResult = {
  userId: number;
  results: Result[];
};

export type NotificationMessage = {
  userId: number;
  message: string;
};

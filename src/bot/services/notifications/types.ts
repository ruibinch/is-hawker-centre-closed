import type { Closure } from '../../../models/Closure';
import type { Language } from '../../lang';

export type UserWithClosure = {
  userId: number;
  languageCode: Language;
  closures: Closure[];
};

export type NotificationMessage = {
  userId: number;
  message: string;
};

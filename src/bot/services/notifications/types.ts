import type { Language } from '../../../lang';
import type { Closure } from '../../../models/Closure';

export type UserWithClosure = {
  userId: number;
  languageCode: Language;
  closures: Closure[];
};

export type NotificationMessage = {
  userId: number;
  message: string;
};

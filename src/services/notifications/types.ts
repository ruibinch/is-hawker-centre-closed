import { Language } from '../../lang';
import { Closure } from '../../models/Closure';

export type UserWithClosure = {
  userId: number;
  languageCode: Language;
  closures: Closure[];
};

export type NotificationMessage = {
  userId: number;
  message: string;
};

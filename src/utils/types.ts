import { Result } from 'ts-results';

import { AWSError } from '../errors/AWSError';

export type Stage = 'dev' | 'prod';

export type Module =
  | 'search'
  | 'favourites'
  | 'language'
  | 'feedback'
  | 'general';

/**
 * Response types
 */

export type BotResponse = {
  message: string;
  choices?: string[];
};

export type ServiceResponse = Result<BotResponse, AWSError | void>;

export function notEmpty<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _: T = value;
  return true;
}

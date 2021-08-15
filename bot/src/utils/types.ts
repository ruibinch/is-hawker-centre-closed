import { ResultType } from '../../../lib/Result';

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

export type ApiResponse<TReturn> = {
  count: number;
  data: TReturn;
};

export type BotResponse = {
  message: string;
  choices?: string[];
};

export type ServiceResponse = ResultType<BotResponse, void>;

export function notEmpty<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _: T = value;
  return true;
}

export type WrappedPromise<T> = { result: T } | { error: Error };

export async function wrapPromise<T>(
  promise: Promise<T>,
): Promise<WrappedPromise<T>> {
  return promise
    .then((result) => ({ result }))
    .catch((err) => ({ error: err }));
}

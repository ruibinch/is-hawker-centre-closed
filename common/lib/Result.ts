/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-classes-per-file */

export type ResultType<TValue = unknown, TError = unknown> =
  | Ok<TValue>
  | Err<TError>;

export const Result = {
  Ok: <TValue>(value?: TValue): ResultType<TValue, never> => {
    const val = value === undefined ? (undefined as unknown as TValue) : value;
    return new Ok(val);
  },
  Err: <TError>(value?: TError): ResultType<never, TError> => {
    const val = value === undefined ? (undefined as unknown as TError) : value;
    return new Err(val);
  },
};

interface BaseResult<TValue, TError> {
  readonly isOk: boolean;
  readonly isErr: boolean;
  readonly value: TValue | TError;
  map<TReturn>(
    mapperFn: (value: TValue | TError) => TReturn,
  ): ResultType<TReturn, TError>;
  toString(): string;
}

export class Ok<TValue> implements BaseResult<TValue, never> {
  readonly isOk: true;

  readonly isErr: false;

  readonly value: TValue;

  constructor(value: TValue) {
    this.isOk = true;
    this.isErr = false;
    this.value = value;
  }

  map<TReturn>(mapper: (value: TValue) => TReturn): Ok<TReturn> {
    return new Ok(mapper(this.value));
  }

  toString(): string {
    return `Ok(${toString(this.value)})`;
  }
}

export class Err<TError> implements BaseResult<never, TError> {
  readonly isOk: false;

  readonly isErr: true;

  readonly value: TError;

  constructor(value: TError) {
    this.isOk = false;
    this.isErr = true;
    this.value = value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map(_mapperFn: unknown): Err<TError> {
    return this;
  }

  toString(): string {
    return `Err(${toString(this.value)})`;
  }
}

function toString(val: unknown): string {
  let value = String(val);
  if (value === '[object Object]') {
    try {
      value = JSON.stringify(val);
    } catch (e) {
      return value;
    }
  }
  return value;
}

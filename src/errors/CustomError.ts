export abstract class CustomError extends Error {
  constructor(message: string) {
    super(`[PLAN] ${message}`);

    // eslint-disable-next-line max-len
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

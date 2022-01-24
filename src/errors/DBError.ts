export class DBError extends Error {
  constructor(details: string) {
    super(`Database error: ${details}`);

    Object.setPrototypeOf(this, DBError.prototype);
  }
}

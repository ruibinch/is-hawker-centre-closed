export class AWSError extends Error {
  constructor(message?: string | null | undefined) {
    super(`AWS operation error: ${message}`);

    Object.setPrototypeOf(this, AWSError.prototype);
  }
}

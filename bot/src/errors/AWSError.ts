export class AWSError extends Error {
  constructor() {
    super('AWS operation error');

    Object.setPrototypeOf(this, AWSError.prototype);
  }
}

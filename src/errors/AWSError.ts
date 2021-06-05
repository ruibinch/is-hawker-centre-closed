import { CustomError } from './CustomError';

export class AWSError extends CustomError {
  constructor() {
    super('AWS operation error');

    Object.setPrototypeOf(this, AWSError.prototype);
  }
}

import { CustomError } from './CustomError';

export class ServiceError extends CustomError {
  constructor() {
    super('No response obtained from service');

    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

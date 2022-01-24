export class ServiceError extends Error {
  constructor() {
    super('No response obtained from service');

    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

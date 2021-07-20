import { CustomError } from './CustomError';

export class TelegramUpdateError extends CustomError {
  constructor() {
    super('Missing message in Telegram update');

    Object.setPrototypeOf(this, TelegramUpdateError.prototype);
  }
}

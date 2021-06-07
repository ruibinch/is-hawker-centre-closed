import { CustomError } from './CustomError';

export class TelegramMessageError extends CustomError {
  constructor() {
    super('Error in Telegram message format');

    Object.setPrototypeOf(this, TelegramMessageError.prototype);
  }
}

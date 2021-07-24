import { CustomError } from './CustomError';

export class TelegramUpdateError extends CustomError {
  constructor(details: string) {
    super(`Missing message in Telegram update: ${details}`);

    Object.setPrototypeOf(this, TelegramUpdateError.prototype);
  }
}

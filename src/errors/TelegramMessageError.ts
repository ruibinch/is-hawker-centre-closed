export class TelegramMessageError extends Error {
  constructor() {
    super('Error in Telegram message format');

    Object.setPrototypeOf(this, TelegramMessageError.prototype);
  }
}

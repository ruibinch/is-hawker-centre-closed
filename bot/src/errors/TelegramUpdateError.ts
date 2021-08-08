export class TelegramUpdateError extends Error {
  constructor(details: string) {
    super(`Missing message in Telegram update: ${details}`);

    Object.setPrototypeOf(this, TelegramUpdateError.prototype);
  }
}

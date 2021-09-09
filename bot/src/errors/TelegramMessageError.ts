import { TelegramResponseBase } from '../utils/telegram';

export class TelegramMessageError extends Error {
  constructor(response: TelegramResponseBase) {
    const errorMessage = makeErrorMessage(response);
    super(errorMessage);

    Object.setPrototypeOf(this, TelegramMessageError.prototype);
  }
}

function makeErrorMessage(response: TelegramResponseBase) {
  const messageSections: string[] = [];

  if (response.description) {
    messageSections.push(response.description);
  }
  if (response.error_code !== undefined) {
    messageSections.unshift(`${response.error_code}`);
  }

  return messageSections.length > 0
    ? messageSections.join(' ')
    : 'Error in Telegram message format';
}

import emojiRegexFactory from 'emoji-regex/RGI_Emoji';
import { Err, Ok, Result } from 'ts-results';

import { t } from '../lang';
import { TelegramMessage } from '../utils/telegram';
import { ValidateResponseError, ValidateResponseOk } from './types';

function isDefined(...variables: unknown[]) {
  return variables.every(Boolean);
}

export function validateInputMessage(
  message: TelegramMessage,
): Result<ValidateResponseOk, ValidateResponseError> {
  let errorMessage = '';
  let textSanitised = '';

  if (message.text === undefined) {
    switch (true) {
      case isDefined(message.animation, message.document):
        errorMessage = t('validation.error.message-type-gif');
        break;
      case isDefined(message.animation):
        errorMessage = t('validation.error.message-type-animation');
        break;
      case isDefined(message.audio):
      case isDefined(message.voice):
        errorMessage = t('validation.error.message-type-audio');
        break;
      case isDefined(message.document):
        errorMessage = t('validation.error.message-type-document');
        break;
      case isDefined(message.location):
        errorMessage = t('validation.error.message-type-location');
        break;
      case isDefined(message.photo):
        errorMessage = t('validation.error.message-type-photo');
        break;
      case isDefined(message.sticker):
        errorMessage = t('validation.error.message-type-sticker');
        break;
      case isDefined(message.video):
        errorMessage = t('validation.error.message-type-video');
        break;
      default:
        errorMessage = t('validation.error.message-type-unknown');
        break;
    }
  } else {
    // a text can be made up of emojis so we gotta check that
    const emojiRegex = emojiRegexFactory();
    const emojiMatch = emojiRegex.exec(message.text);

    if (emojiMatch) {
      errorMessage = t('validation.error.message-type-emoji');
    } else {
      textSanitised = sanitiseInputText(message.text);
      if (textSanitised.length === 0) {
        errorMessage = t('validation.error.message-empty');
      }
    }
  }

  if (errorMessage !== '') {
    return Err({
      errorMessage: t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage,
      }),
    });
  }

  return Ok({
    textSanitised,
  });
}

/**
 * Whitelisted characters:
 * alphanumeric characters, numbers, /, ', (), whitespace, underscore
 */
export function sanitiseInputText(text: string): string {
  const filterRegex = /[^a-zA-Z0-9/'()\s_]/g;
  return text.replace(filterRegex, '').trim();
}

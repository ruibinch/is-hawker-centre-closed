import emojiRegexFactory from 'emoji-regex/RGI_Emoji';

import { TelegramMessage } from '../common/telegram';
import { ValidateInputMessageResponse } from './types';

export function validateInputMessage(
  message: TelegramMessage,
): ValidateInputMessageResponse {
  let errorMessage = '';
  let textSanitised = '';

  if (message.text === undefined) {
    switch (true) {
      case message.animation && message.document:
        errorMessage = 'Gifs are not allowed\\.';
        break;
      case message.animation:
        errorMessage = 'Animations are not allowed\\.';
        break;
      case message.audio:
        errorMessage = 'Audio messages are not allowed\\.';
        break;
      case message.contact:
        errorMessage = 'Contacts are not allowed\\.';
        break;
      case message.document:
        errorMessage = 'Documents are not allowed\\.';
        break;
      case message.location:
        errorMessage = 'Locations are not allowed\\.';
        break;
      case message.photo:
        errorMessage = 'Photos are not allowed\\.';
        break;
      case message.sticker:
        errorMessage = 'Stickers are not allowed\\.';
        break;
      case message.video:
        errorMessage = 'Videos are not allowed\\.';
        break;
      case message.voice:
        errorMessage = 'Voice messages are not allowed\\.';
        break;
      default:
        errorMessage = 'Invalid message type\\.';
        break;
    }
  } else {
    // a text can be made up of emojis so we gotta check that
    const emojiRegex = emojiRegexFactory();
    const emojiMatch = emojiRegex.exec(message.text);

    if (emojiMatch) {
      errorMessage = 'Emojis are not allowed\\.';
    } else {
      textSanitised = sanitiseInputText(message.text);
      if (textSanitised.length === 0) {
        errorMessage = 'No text found\\.';
      }
    }
  }

  if (errorMessage !== '') {
    return {
      success: false,
      errorMessage: `\u{2757} ${errorMessage}\n\nPlease try again with a text message\\.`,
    };
  }

  return {
    success: true,
    textSanitised,
  };
}

/**
 * Whitelisted characters:
 * alphanumeric characters, numbers, /, ', (), whitespace, underscore
 */
export function sanitiseInputText(text: string): string {
  const filterRegex = /[^a-zA-Z0-9/'()\s_]/g;
  return text.replace(filterRegex, '').trim();
}

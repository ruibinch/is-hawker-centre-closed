import emojiRegexFactory from 'emoji-regex/RGI_Emoji';

import { TelegramMessage } from '../common/telegram';
import { ValidateInputMessageResponse } from './types';

function isDefined(...variables: unknown[]) {
  return variables.every(Boolean);
}

export function validateInputMessage(
  message: TelegramMessage,
): ValidateInputMessageResponse {
  let errorMessage = '';
  let textSanitised = '';

  if (message.text === undefined) {
    switch (true) {
      case isDefined(message.animation, message.document):
        errorMessage = 'Not sure how to interpret this gif\\.\\.\\.';
        break;
      case isDefined(message.animation):
        errorMessage = 'Not sure how to interpret this animation\\.\\.\\.';
        break;
      case isDefined(message.audio):
      case isDefined(message.voice):
        errorMessage =
          'Speech\\-to\\-text technology is too advanced for this bot\\.';
        break;
      case isDefined(message.document):
        errorMessage =
          'This is just a humble bot, do you think it can understand a whole document?\\!';
        break;
      case isDefined(message.location):
        errorMessage =
          'Searching by coordinates is too advanced for this bot\\.';
        break;
      case isDefined(message.photo):
        errorMessage =
          'Image\\-to\\-text technology is too advanced for this bot\\.';
        break;
      case isDefined(message.sticker):
        errorMessage = 'Not sure how to interpret this sticker\\.\\.\\.';
        break;
      case isDefined(message.video):
        errorMessage =
          'If images are too advanced for this bot, videos are definitely out of the question\\.';
        break;
      default:
        errorMessage = 'No idea what this message is about\\!';
        break;
    }
  } else {
    // a text can be made up of emojis so we gotta check that
    const emojiRegex = emojiRegexFactory();
    const emojiMatch = emojiRegex.exec(message.text);

    if (emojiMatch) {
      errorMessage =
        "That's a cute emoji but this bot has no idea which hawker centre that could refer to\\.";
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

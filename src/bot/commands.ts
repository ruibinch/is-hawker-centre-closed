/* eslint-disable max-len */
import { Result, ResultType } from '../lib/Result';
import { TelegramSendMessageParams } from '../telegram';
import features from './features';
import { t } from './lang';
import type { Command, Module } from './types';

export const COMMANDS: Command[] = [
  {
    module: 'general',
    endpoint: '/start',
    hasExplanation: true,
    description: 'Welcome message',
  },
  {
    module: 'general',
    endpoint: '/help',
    hasExplanation: true,
    description: 'Bot usage guide',
  },
  {
    module: 'favourites',
    endpoint: '/list',
    hasExplanation: false,
    description: 'View your favourites and their next closure dates',
  },
  {
    module: 'favourites',
    endpoint: '/fav',
    hasExplanation: true,
    description: 'Add to your favourites',
  },
  {
    module: 'favourites',
    endpoint: '/del',
    hasExplanation: true,
    description: 'Delete from your favourites',
  },
  {
    module: 'favourites',
    endpoint: '/notify',
    hasExplanation: false,
    description: 'Toggle your notification setting',
  },
  {
    module: 'language',
    endpoint: '/language',
    hasExplanation: true,
    description: 'Toggle your preferred language',
  },
  {
    module: 'feedback',
    endpoint: '/feedback',
    hasExplanation: true,
    description: 'Submit your feedback!',
  },
  {
    module: 'general',
    endpoint: '/weather',
    hasExplanation: false,
    description: "Check today's weather report",
    isStartingSlashOptional: true,
  },
  {
    module: 'general',
    endpoint: '/updates',
    hasExplanation: false,
    description: 'Check the latest updates',
  },
];

/**
 * Returns if a keyword is in the structure of a command, i.e. starting with a slash and containing only one word.
 */
export function isCommand(s: string): boolean {
  return s.startsWith('/') && s.split(' ').length === 1;
}

/**
 * Returns if a keyword is a command under the specified module.
 * If the module is omitted, the check is done across all modules.
 */
export function isCommandInModule(s: string, module?: Module): boolean {
  const command = s.split(' ')[0].toLowerCase();

  return COMMANDS.filter((cmd) => (module ? cmd.module === module : true))
    .reduce((_commandsList: string[], cmd) => {
      if (cmd.isStartingSlashOptional) {
        _commandsList.push(...[cmd.endpoint, cmd.endpoint.replace('/', '')]);
      } else {
        _commandsList.push(cmd.endpoint);
      }
      return _commandsList;
    }, [])
    .includes(command);
}

/**
 * Returns if a command does not have an associated explanation, i.e. it should not be handled as a generic command but via custom handling.
 */
function isCommandWithoutExplanation(s: string): boolean {
  return COMMANDS.filter((cmd) => !cmd.hasExplanation)
    .map((cmd) => cmd.endpoint)
    .includes(s);
}

function isCommandSupported(s: string): boolean {
  return COMMANDS.map((cmd) => cmd.endpoint).includes(s);
}

export function makeCommandMessage(
  s: string,
): ResultType<TelegramSendMessageParams> {
  if (isCommandWithoutExplanation(s)) {
    return Result.Err();
  }

  if (!isCommandSupported(s)) {
    return Result.Ok({
      text:
        t('general.error.unsupported-command.first') +
        t('general.error.unsupported-command.second', {
          commands: COMMANDS.map((cmd) =>
            formatEndpointForDisplay(cmd.endpoint),
          ).join(', '),
        }),
    });
  }

  const sendMessageParams: TelegramSendMessageParams = {
    text: '',
  };

  switch (s) {
    case '/start': {
      sendMessageParams.text =
        t('general.command-start.explanation.first', {
          emojis: '\u{1F35C}\u{1F35B}\u{1F367}',
        }) +
        t('general.command-start.explanation.second') +
        t('general.command-start.explanation.third');

      if (features('ENABLE_WEBAPP')) {
        sendMessageParams.reply_markup = {
          inline_keyboard: [
            [
              {
                text: 'Help Manual',
                web_app: { url: 'https://ihcc-webapp.vercel.app/' },
              },
            ],
          ],
        };
      }
      break;
    }
    case '/help': {
      sendMessageParams.text =
        t('general.command-help.explanation.search-section.first', {
          emoji: '\u{1F50D}',
        }) +
        t('general.command-help.explanation.search-section.second') +
        t('general.command-help.explanation.search-section.third') +
        t('general.command-help.explanation.search-section.fourth') +
        t('general.command-help.explanation.search-section.fifth') +
        t('general.command-help.explanation.search-section.sixth') +
        t('general.command-help.explanation.search-section.seventh') +
        t('general.command-help.explanation.search-section.eighth') +
        t('general.command-help.explanation.search-section.ninth') +
        t('general.command-help.explanation.favourites-section.first', {
          emoji: '\u{1F31F}',
        }) +
        t('general.command-help.explanation.favourites-section.second') +
        t('general.command-help.explanation.favourites-section.third') +
        t('general.command-help.explanation.favourites-section.fourth') +
        t('general.command-help.explanation.language-section.first', {
          emoji: '\u{1F4AC}',
        }) +
        t('general.command-help.explanation.language-section.second');
      break;
    }
    case '/fav': {
      sendMessageParams.text =
        t('favourites.command-fav.explanation.first') +
        t('favourites.command-fav.explanation.second');
      break;
    }
    case '/del': {
      sendMessageParams.text =
        t('favourites.command-del.explanation.first') +
        t('favourites.command-del.explanation.second');
      break;
    }
    case '/language': {
      sendMessageParams.text =
        t('language.command-language.explanation.first') +
        t('language.command-language.explanation.second') +
        t('language.command-language.explanation.third');
      break;
    }
    case '/feedback': {
      sendMessageParams.text =
        t('feedback.command-feedback.explanation.first') +
        t('feedback.command-feedback.explanation.second', {
          example: makeRandomFeedbackExample(),
        });
      break;
    }
    /* istanbul ignore next */
    default:
      break;
  }

  if (sendMessageParams.text === '') return Result.Err();
  return Result.Ok(sendMessageParams);
}

function formatEndpointForDisplay(endpoint: string) {
  return endpoint.replace(/_/g, '\\_');
}

function makeRandomFeedbackExample(): string {
  const feedbackExamples = [
    'Bot icon is ugly',
    'Commands are confusing',
    'Brilliant bot!',
    'Improve the help messages',
    'More emojis needed',
    'Change the bot name',
    'Can it include the individual stalls in the hawker centre too?',
  ];

  return feedbackExamples[generateRandomInt(0, feedbackExamples.length)];
}

// Returns a number in the range [min, max)
/* istanbul ignore next */
function generateRandomInt(min: number, max: number) {
  // for cleaner testing instead of relying on numerous mocks
  if (process.env.NODE_ENV === 'test') return min;

  return Math.floor(Math.random() * (max - min) + min);
}

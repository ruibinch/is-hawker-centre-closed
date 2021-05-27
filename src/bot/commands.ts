/* eslint-disable max-len */
import { t } from '../lang';
import { Module } from '../utils/types';
import { Command } from './types';

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
    module: 'feedback',
    endpoint: '/feedback',
    hasExplanation: true,
    description: 'Submit your feedback!',
  },
];

// If this file is run as a script, print the list of commands with associated descriptions for feeding into Telegram BotFather.
/* istanbul ignore next */
if (require.main === module) {
  console.log(
    COMMANDS.map(
      (cmd) => `${cmd.endpoint.replace('/', '')} - ${cmd.description}`,
    ).join('\n'),
  );
}

/**
 * Returns if a keyword is in the structure of a command, i.e. starting with a slash and containing only one word.
 */
export function isCommand(s: string): boolean {
  return s.startsWith('/') && s.split(' ').length === 1;
}

/**
 * Returns if a command is belongs to the input specified module.
 */
export function isCommandInModule(s: string, module: Module): boolean {
  const [command] = s.split(' ');

  return COMMANDS.filter((cmd) => cmd.module === module)
    .map((cmd) => cmd.endpoint)
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

/**
 * Returns if a command is supported.
 */
function isCommandSupported(s: string): boolean {
  return COMMANDS.map((cmd) => cmd.endpoint).includes(s);
}

export function makeCommandMessage(s: string): string | undefined {
  if (isCommandWithoutExplanation(s)) {
    return undefined;
  }

  let reply = '';

  if (!isCommandSupported(s)) {
    return (
      t('general.error.unsupported-command.first') +
      t('general.error.unsupported-command.second', {
        commands: COMMANDS.map((cmd) =>
          formatEndpointForDisplay(cmd.endpoint),
        ).join(', '),
      })
    );
  }

  switch (s) {
    case '/start': {
      reply =
        t('general.command-start.explanation.first', {
          emojis: '\u{1F35C}\u{1F35B}\u{1F367}',
        }) +
        t('general.command-start.explanation.second', {
          example: makeRandomSearchKeywordExample(),
        }) +
        t('general.command-start.explanation.third');
      break;
    }
    case '/help': {
      reply =
        t('general.command-help.explanation.search-section.first', {
          emoji: '\u{1F50D}',
        }) +
        t('general.command-help.explanation.search-section.second') +
        t('general.command-help.explanation.search-section.third') +
        t('general.command-help.explanation.search-section.fourth') +
        t('general.command-help.explanation.search-section.fifth') +
        t('general.command-help.explanation.search-section.sixth') +
        t('general.command-help.explanation.search-section.seventh', {
          example: makeRandomSearchExample(),
        }) +
        t('general.command-help.explanation.favourites-section.first', {
          emoji: '\u{1F31F}',
        }) +
        t('general.command-help.explanation.favourites-section.second') +
        t('general.command-help.explanation.favourites-section.third') +
        t('general.command-help.explanation.favourites-section.fourth');
      break;
    }
    case '/fav': {
      reply =
        t('favourites.command-fav.explanation.first') +
        t('favourites.command-fav.explanation.second', {
          example: makeRandomSearchKeywordExample(),
        });
      break;
    }
    case '/del': {
      reply =
        t('favourites.command-del.explanation.first') +
        t('favourites.command-del.explanation.second');
      break;
    }
    case '/feedback': {
      reply =
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

  return reply;
}

function formatEndpointForDisplay(endpoint: string) {
  return endpoint.replace(/_/g, '\\_');
}

const searchExamples = [
  ['bedok', 'bedok', 'today'],
  ['holland', 'holland', 'today'],
  ['clementi today', 'clementi', 'today'],
  ['redhill today', 'redhill', 'today'],
  ['ang mo kio tmr', 'ang mo kio', 'tomorrow'],
  ['tampines tmr', 'tampines', 'tomorrow'],
  ['bukit merah tomorrow', 'bukit merah', 'tomorrow'],
  ['whampoa tomorrow', 'whampoa', 'tomorrow'],
  ['toa payoh month', 'toa payoh', 'this month'],
  ['yishun month', 'yishun', 'this month'],
  ['jurong next month', 'jurong', 'next month'],
  ['telok next month', 'telok', 'next month'],
];

function makeRandomSearchExample(): string {
  const searchExample =
    searchExamples[generateRandomInt(0, searchExamples.length)];
  const [searchTerm, keyword, modifier] = searchExample;

  return t('search.example-format', {
    searchTerm,
    keyword,
    modifier,
  });
}

function makeRandomSearchKeywordExample(): string {
  const searchExample =
    searchExamples[generateRandomInt(0, searchExamples.length)];
  return searchExample[1];
}

const feedbackExamples = [
  'Bot icon is ugly',
  'Commands are confusing',
  'Brilliant bot!',
  'Improve the help messages',
  'More emojis needed',
  'Change the bot name',
  'Can it include the individual stalls in the hawker centre too?',
];

function makeRandomFeedbackExample(): string {
  return feedbackExamples[generateRandomInt(0, feedbackExamples.length)];
}

// Returns a number in the range [min, max)
function generateRandomInt(min: number, max: number) {
  // for cleaner testing instead of relying on numerous mocks
  if (process.env.NODE_ENV === 'test') return min;

  return Math.floor(Math.random() * (max - min) + min);
}

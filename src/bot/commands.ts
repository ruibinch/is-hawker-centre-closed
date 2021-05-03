/* eslint-disable max-len */
import { Module } from '../common/types';
import { Command } from './types';

export const COMMANDS: Command[] = [
  {
    module: Module.general,
    endpoint: '/start',
    hasExplanation: true,
    description: 'Welcome message',
  },
  {
    module: Module.general,
    endpoint: '/help',
    hasExplanation: true,
    description: 'Bot usage guide',
  },
  {
    module: Module.favourites,
    endpoint: '/fav',
    hasExplanation: true,
    description: 'Add to your favourites',
  },
  {
    module: Module.favourites,
    endpoint: '/list',
    hasExplanation: false,
    description: 'View your favourites and their next closure dates',
  },
  {
    module: Module.favourites,
    endpoint: '/del',
    hasExplanation: true,
    description: 'Delete from your favourites',
  },
  {
    module: Module.feedback,
    endpoint: '/feedback',
    hasExplanation: true,
    description: 'Submit your feedback!',
  },
];

// If this file is run as a script, print the list of commands with associated descriptions for feeding into Telegram BotFather.
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
    reply =
      `Woops, that isn't a supported command\\.\n\n` +
      `Please try again with one of the following:\n` +
      `${COMMANDS.map((cmd) => formatEndpointForDisplay(cmd.endpoint)).join(
        ', ',
      )}`;
    return reply;
  }

  switch (s) {
    case '/start': {
      reply =
        `An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n` +
        `Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _${makeRandomSearchKeywordExample()}_\\.\n\n` +
        `Type in /help to see how you can customise your query further, as well as other features of the bot\\.`;
      break;
    }
    case '/help': {
      // Search section
      reply =
        `\u{1F50D} *Search*\n\n` +
        `The search query follows the structure:\n\n` +
        '          `\\[keyword\\] \\[timeframe\\]`\n\n' +
        `Supported timeframes are:\n` +
        `_today_, _tmr_, _tomorrow_, _month_, _next month_\n` +
        `\\(default is _today_\\)\n\n`;
      reply += makeRandomSearchExample();
      reply += '\n\n';
      // Favourites section
      reply +=
        '\u{1F31F} *Favourites*\n\n' +
        'You can manage your favourite hawker centres via the /fav and /del commands\\.\n\n' +
        'Typing /list will show you all your favourites as well as their next closure dates, making for an even easier way for you to check on their closure status\\!';
      break;
    }
    case '/fav': {
      reply =
        `Please specify some keyword to filter the list of hawker centres for you to add to your favourites\\.\n\n` +
        `e\\.g\\. _/fav ${makeRandomSearchKeywordExample()}_`;
      break;
    }
    case '/del': {
      reply =
        'To delete a favourite hawker centre, specify an index number based on the favourites list displayed by the /list command\\.\n\n' +
        `e\\.g\\. _/del 3_`;
      break;
    }
    case '/feedback': {
      reply =
        'Type in your feedback after a /feedback command\\.\n\n' +
        `e\\.g\\. _/feedback ${makeRandomFeedbackExample()}_`;
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
  return `e\\.g\\. _${searchTerm}_ will display the hawker centres containing the keyword __${keyword}__ that are closed __${modifier}__\\.`;
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

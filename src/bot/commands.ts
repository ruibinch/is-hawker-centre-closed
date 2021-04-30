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
        `Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _toa payoh_\n\n` +
        `For more options\\, type in /help to see how you can customise your query further\\.`;
      break;
    }
    case '/help': {
      reply =
        `The search query follows the structure:\n\n` +
        '          `\\[keyword\\] \\[timeframe\\]`\n\n' +
        `Supported timeframes are:\n` +
        `_today_, _tmr_, _tomorrow_, _month_, _next month_\n\n` +
        `When no timeframe is specified, it is default to _today_\\.\n\n`;
      reply += makeRandomExample();
      break;
    }
    case '/fav': {
      reply =
        `Please specify some keyword to filter the list of hawker centres for you to add to your favourites\\.\n\n` +
        `e\\.g\\. _/fav ${getRandomExampleKeyword()}_`;
      break;
    }
    case '/del': {
      reply =
        'To delete a favourite hawker centre, specify an index number based on the favourites list displayed by the /list command\\.\n\n' +
        `e\\.g\\. _/del 3_`;
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

const examples = [
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

function makeRandomExample(): string {
  const example = examples[generateRandomInt(0, examples.length)];
  const [searchTerm, keyword, modifier] = example;
  return `e\\.g\\. _${searchTerm}_ will display the hawker centres containing the keyword __${keyword}__ that are closed __${modifier}__\\.`;
}

function getRandomExampleKeyword(): string {
  const example = examples[generateRandomInt(0, examples.length)];
  return example[1];
}

// Returns a number in the range [min, max)
function generateRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

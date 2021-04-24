/* eslint-disable max-len */
const SUPPORTED_COMMANDS = ['/start', '/help', '/fav', '/del'];
const NON_INFO_COMMANDS = ['/list'];

export function isInfoCommand(s: string): boolean {
  return (
    s.startsWith('/') &&
    s.split(' ').length === 1 &&
    !NON_INFO_COMMANDS.includes(s)
  );
}

function isSupportedInfoCommand(s: string): boolean {
  return SUPPORTED_COMMANDS.includes(s);
}

export function makeCommandMessage(s: string): string {
  let reply = '';

  if (!isSupportedInfoCommand(s)) {
    reply =
      `Woops, that isn't a supported command\\.\n\n` +
      `Please try again with one of the following:\n` +
      `${SUPPORTED_COMMANDS.join(', ')}`;
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

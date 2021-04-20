import { makeCommandMessage } from '../../src/bot/commands';

describe('bot > commands', () => {
  describe('/start', () => {
    it('returns the correct message', () => {
      const expectedMessage =
        `An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n` +
        `Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _toa payoh_\n\n` +
        `For more options\\, type in /help to see how you can customise your query further\\.`;

      const commandMessage = makeCommandMessage('/start');
      expect(commandMessage).toEqual(expectedMessage);
    });
  });

  describe('/help', () => {
    it('returns the correct message', () => {
      const expectedMessage =
        `The search query follows the structure:\n\n` +
        '          `\\[keyword\\] \\[timeframe\\]`\n\n' +
        `Supported timeframes are:\n` +
        `_today_, _tmr_, _tomorrow_, _month_, _next month_\n\n` +
        `When no timeframe is specified, it is default to _today_\\.\n\n`;

      const commandMessage = makeCommandMessage('/help');
      expect(commandMessage).toEqual(expect.stringContaining(expectedMessage));
    });
  });

  describe('/fav', () => {
    it('returns the correct helper message', () => {
      const expectedMessage =
        `Please specify some keyword to filter the list of hawker centres for you to add to your favourites\\.\n\n` +
        `e\\.g\\. _/fav `;

      const commandMessage = makeCommandMessage('/fav');
      expect(commandMessage).toEqual(expect.stringContaining(expectedMessage));
    });
  });

  describe('an unsupported command', () => {
    it('returns the correct message', () => {
      const expectedMessage =
        `Woops, that isn't a supported command\\.\n\n` +
        `Please try again with one of the following:\n`;

      const commandMessage = makeCommandMessage('/invalid');
      expect(commandMessage).toEqual(expect.stringContaining(expectedMessage));
    });
  });
});

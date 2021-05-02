/* eslint-disable max-len */
import { makeCommandMessage } from '../commands';

describe('bot > commands', () => {
  describe('/start', () => {
    it('returns the correct message', () => {
      const expectedMessage =
        `An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n` +
        `Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _toa payoh_\\.\n\n` +
        `Type in /help to see how you can customise your query further, as well as other features of the bot\\.`;

      const commandMessage = makeCommandMessage('/start');
      expect(commandMessage).toEqual(expectedMessage);
    });
  });

  describe('/help', () => {
    it('returns the correct message', () => {
      const expectedMessageSearchSection =
        `\u{1F50D} *Search*\n\n` +
        `The search query follows the structure:\n\n` +
        '          `\\[keyword\\] \\[timeframe\\]`\n\n' +
        `Supported timeframes are:\n` +
        `_today_, _tmr_, _tomorrow_, _month_, _next month_\n` +
        `\\(default is _today_\\)\n\n`;
      const expectedMessageFavSection =
        '\u{1F31F} *Favourites*\n\n' +
        'You can manage your favourite hawker centres via the /fav and /del commands\\.\n\n' +
        'Typing /list will show you all your favourites as well as their next closure dates, making for an even easier way for you to check on their closure status\\!';

      const commandMessage = makeCommandMessage('/help');
      expect(commandMessage).toEqual(
        expect.stringContaining(expectedMessageSearchSection),
      );
      expect(commandMessage).toEqual(
        expect.stringContaining(expectedMessageFavSection),
      );
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

  describe('/del', () => {
    it('returns the correct helper message', () => {
      const expectedMessage =
        'To delete a favourite hawker centre, specify an index number based on the favourites list displayed by the /list command\\.\n\n' +
        `e\\.g\\. _/del 3_`;

      const commandMessage = makeCommandMessage('/del');
      expect(commandMessage).toEqual(expect.stringContaining(expectedMessage));
    });
  });

  describe('/list', () => {
    it('returns undefined as /list should be handled by the favourites module', () => {
      const commandMessage = makeCommandMessage('/list');
      expect(commandMessage).toBeUndefined();
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

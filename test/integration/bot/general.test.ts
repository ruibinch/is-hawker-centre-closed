/* eslint-disable max-len */
import * as weatherService from '../../../src/bot/services/general/weather';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import * as telegramMethods from '../../../src/telegram/methods';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('[bot] [integration] General module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
  });

  beforeEach(() => {
    sendMessageSpy = jest
      .spyOn(telegramMethods, 'sendMessage')
      .mockImplementation(() => Promise.resolve());
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();

    getUserByIdSpy.mockRestore();
  });

  describe('commands', () => {
    it('["/start"] returns the correct message', async () => {
      const inputMessage = '/start';
      const expectedMessage =
        'An easy way to check when your favourite hawker centre is next closed\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n' +
        'Simply send the bot *a part of the hawker centre name*, e\\.g\\. `ang mo kio`, `85`, `bukit`\\.\n\n' +
        'Check out the help manual for more features and commands supported by the bot\\.';
      const expectedReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: 'Help Manual',
              web_app: { url: 'https://ihcc-webapp.vercel.app/' },
            },
          ],
        ],
      };

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, {
        text: expectedMessage,
        reply_markup: expectedReplyMarkup,
      });
    });

    it('["/help"] returns the correct message', async () => {
      const inputMessage = '/help';
      const expectedMessage =
        '\u{1F50D} *Search*\n\n' +
        'By default, the bot returns the *next closure dates* of the hawker centres matching your search query\\.\n\n' +
        'You can modify the search behaviour by adding one of these supported *timeframes* at the end:\n' +
        '• `tdy` / `today`\n• `tmr` / `tomorrow`\n• `week` / `this week`\n• `next week`\n• `month`\n• `next month`\n• `next` \\(_default_\\)\n\n' +
        'You can also search *by timeframe* alone\\.\n\n' +
        'Examples:\n' +
        '• "`bedok next week`" will display the hawker centres relating to the keyword __bedok__ that are closed __next week__\n' +
        '• "`jurong next`" will display the hawker centres relating to the keyword __jurong__ and their __next closure dates__\n' +
        '• "`tomorrow`" will display all hawker centres that are closed __tomorrow__\n\n' +
        '\u{1F31F} *Favourites*\n\n' +
        'You can manage your favourite hawker centres via the `/fav` and `/del` commands\\.\n\n' +
        'Typing `/list` will show you all your added favourites as well as their next closure dates\\.\n\n' +
        'When one of your favourite hawker centres is closed, a notification will be sent to you on that day at *6am SGT*\\. Use the `/notify` command to view/toggle your notification setting\\.\n\n' +
        '\u{1F4AC} *Language*\n\n' +
        'You can toggle your preferred language option using the `/language` command\\.\n\n';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('returns the correct prompt when an unsupported command is sent', async () => {
      const inputMessage = '/invalid';
      const expectedMessage =
        "Woops, that isn't a supported command\\.\n\n" +
        'Please try again with one of the following:\n' +
        '/start, /help, /list, /fav, /del, /notify, /language, /feedback, /weather, /updates';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });
  });

  describe('general module', () => {
    let getWeatherReportSpy: jest.SpyInstance;

    beforeAll(() => {
      getWeatherReportSpy = jest
        .spyOn(weatherService, 'getWeatherReport')
        .mockImplementation(() => Promise.resolve(Result.Ok()));
    });

    afterEach(() => {
      getWeatherReportSpy.mockClear();
    });

    it('["/updates"] returns the latest updates', async () => {
      const inputMessage = '/updates';
      const updateEntries = [
        '*\\[0\\.21\\.0\\] 2023\\-06\\-18*\n' +
          '\u{00B7} Implemented fuzzy search for better search matching',
        '*\\[0\\.20\\.1\\] 2022\\-12\\-25*\n' +
          '\u{00B7} Fixed missing hawker centre search results when no next closure date is available',
        '*\\[0\\.20\\.0\\] 2022\\-10\\-02*\n' +
          '\u{00B7} Added support for recently permanently closed hawker centres\n' +
          '\u{00B7} Fixed error when a favourited hawker centre no longer exists',
        '*\\[0\\.19\\.0\\] 2022\\-09\\-04*\n' +
          '\u{00B7} Displayed closure remarks if applicable\n' +
          '\u{00B7} Standardised list display across modules\n' +
          "\u{00B7} Fixed user's preferred language not being reflected correctly in paginated search results",
        '*\\[0\\.18\\.0\\] 2022\\-08\\-21*\n' +
          '\u{00B7} Added "/weather" command',
        '*\\[0\\.17\\.0\\] 2022\\-08\\-14*\n' +
          '\u{00B7} Added search by "week"/"this week" timeframe',
        '*\\[0\\.16\\.0\\] 2022\\-08\\-11*\n' +
          '\u{00B7} Updated data schema and improved bot security',
        '*\\[0\\.15\\.0\\] 2022\\-07\\-17*\n' +
          '\u{00B7} Improved search filter logic',
        '*\\[0\\.14\\.0\\] 2022\\-07\\-04*\n' +
          '\u{00B7} Implemented pagination for search result lists exceeding 10 entries',
      ];
      const expectedMessage = updateEntries.join('\n\n');

      await callBot(inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["/weather"] correctly calls getWeatherReport', async () => {
      const inputMessage = '/weather';
      await callBot(inputMessage);
      expect(getWeatherReportSpy).toHaveBeenCalled();
    });

    it('["Weather"] correctly calls getWeatherReport', async () => {
      const inputMessage = 'Weather';
      await callBot(inputMessage);
      expect(getWeatherReportSpy).toHaveBeenCalled();
    });
  });

  describe('empty input', () => {
    it('returns the correct error message', async () => {
      const inputMessage = '';
      const expectedMessage =
        '\u{2757} No text found\\.\n\nPlease try again with a text message\\.';

      await callBot(inputMessage);
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

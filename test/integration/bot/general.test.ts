/* eslint-disable max-len */
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
        '• `tdy` / `today`\n• `tmr` / `tomorrow`\n• `next week`\n• `month`\n• `next month`\n• `next` \\(_default_\\)\n\n' +
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
        '/start, /help, /list, /fav, /del, /notify, /language, /feedback, /updates';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });
  });

  describe('updates module', () => {
    it('["/updates"] returns the latest updates', async () => {
      const inputMessage = '/updates';
      const updateEntries = [
        '*\\[0\\.15\\.0\\] 2022\\-07\\-17*\n' +
          '\u{00B7} Improved search filter logic',
        '*\\[0\\.14\\.0\\] 2022\\-07\\-04*\n' +
          '\u{00B7} Implemented pagination for search result lists exceeding 10 entries',
        '*\\[0\\.13\\.0\\] 2021\\-09\\-18*\n' +
          '\u{00B7} Added search by "next week" timeframe',
      ];
      const expectedMessage = updateEntries.join('\n\n');

      await callBot(inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
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

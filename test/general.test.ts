/* eslint-disable max-len */
import { Err } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as UserFile from '../src/models/User';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('General module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    getUserByIdSpy.mockRestore();
  });

  describe('/start', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        'An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n' +
        'Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _bedok_\\.\n\n' +
        'Type in /help to see how you can customise your query further, as well as other features of the bot\\.';

      await callBot('/start');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('/help', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        '\u{1F50D} *Search*\n\n' +
        'The search query follows the structure:\n\n' +
        '          `\\[keyword\\] \\[timeframe\\]`\n\n' +
        'Supported timeframes are:\n' +
        '_today_, _tmr_, _tomorrow_, _month_, _next month_\n' +
        '\\(default is _today_\\)\n\n' +
        'e\\.g\\. _bedok_ will display the hawker centres containing the keyword __bedok__ that are closed __today__\\.\n\n' +
        '\u{1F31F} *Favourites*\n\n' +
        'You can manage your favourite hawker centres via the /fav and /del commands\\.\n\n' +
        'Typing /list will show you all your favourites as well as their next closure dates, making for an even easier way for you to check on their closure status\\!\n\n' +
        'When one of your favourite hawker centres is closed, a notification will be sent to you on that day at *6am SGT*\\. Use the /notify command to view/toggle your notification setting\\.\n\n' +
        '\u{1F4AC} *Language*\n\n' +
        'You can toggle your preferred language option using the /language command\\.\n\n';

      await callBot('/help');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('empty input', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        '\u{2757} No text found\\.\n\nPlease try again with a text message\\.';

      await callBot('');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('an unsupported command', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        "Woops, that isn't a supported command\\.\n\n" +
        'Please try again with one of the following:\n' +
        '/start, /help, /list, /fav, /del, /notify, /language, /feedback';

      await callBot('/invalid');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

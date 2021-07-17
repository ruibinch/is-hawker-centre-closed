/* eslint-disable max-len */
import { Err } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as InputFile from '../src/models/Input';
import * as UserFile from '../src/models/User';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('General module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();

    getUserByIdSpy.mockRestore();
  });

  describe('/start', () => {
    it('returns the correct message', async () => {
      const inputMessage = '/start';
      const expectedMessage =
        'An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n' +
        'Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _bedok_\\.\n\n' +
        'Type in /help to see how you can customise your query further, as well as other features of the bot\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('/help', () => {
    it('returns the correct message', async () => {
      const inputMessage = '/help';
      const expectedMessage =
        '\u{1F50D} *Search*\n\n' +
        'By default, the bot finds hawker centres containing your input keyword that are closed *today*\\.\n\n' +
        'You can modify the search timeframe by adding one of these supported timeframes at the end:\n' +
        '_today_, _tmr_, _tomorrow_, _month_, _next month_, _next_\n\n' +
        'You can also search *by timeframe* alone\\.\n\n' +
        'Examples:\n' +
        '• "_bedok month_" will display the hawker centres containing the keyword __bedok__ that are closed __this month__\n' +
        '• "_jurong next_" will display the hawker centres containing the keyword __jurong__ and their next closure dates\n' +
        '• "_tomorrow_" will display all hawker centres that are closed __tomorrow__\n\n' +
        '\u{1F31F} *Favourites*\n\n' +
        'You can manage your favourite hawker centres via the /fav and /del commands\\.\n\n' +
        'Typing /list will show you all your favourites as well as their next closure dates, making for an even easier way for you to check on their closure status\\!\n\n' +
        'When one of your favourite hawker centres is closed, a notification will be sent to you on that day at *6am SGT*\\. Use the /notify command to view/toggle your notification setting\\.\n\n' +
        '\u{1F4AC} *Language*\n\n' +
        'You can toggle your preferred language option using the /language command\\.\n\n';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('empty input', () => {
    it('returns the correct message', async () => {
      const inputMessage = '';
      const expectedMessage =
        '\u{2757} No text found\\.\n\nPlease try again with a text message\\.';

      await callBot(inputMessage);
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('an unsupported command', () => {
    it('returns the correct message', async () => {
      const inputMessage = '/invalid';
      const expectedMessage =
        "Woops, that isn't a supported command\\.\n\n" +
        'Please try again with one of the following:\n' +
        '/start, /help, /list, /fav, /del, /notify, /language, /feedback';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

/* eslint-disable max-len */
import { Result } from '../../../lib/Result';
import * as sender from '../../src/bot/sender';
import { AWSError } from '../../src/errors/AWSError';
import * as InputFile from '../../src/models/Input';
import * as UserFile from '../../src/models/User';
import * as searchLogic from '../../src/services/search/logic';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('[integration] General module', () => {
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
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
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
        'An easy way to check if your favourite hawker centre is closed today\\! \u{1F35C}\u{1F35B}\u{1F367}\n\n' +
        'Simply send the bot some *subset of the hawker centre name*, e\\.g\\. _bedok_\\.\n\n' +
        'Type in /help to see how you can customise your query further, as well as other features of the bot\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["/help"] returns the correct message', async () => {
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

    it('returns the correct prompt when an unsupported command is sent', async () => {
      const inputMessage = '/invalid';
      const expectedMessage =
        "Woops, that isn't a supported command\\.\n\n" +
        'Please try again with one of the following:\n' +
        '/start, /help, /list, /fav, /del, /notify, /language, /feedback, /updates';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('updates module', () => {
    it('["/updates"] returns the latest updates', async () => {
      const inputMessage = '/updates';
      const updateEntries = [
        '*\\[0\\.11\\.0\\] 2021\\-08\\-08*\n' +
          '\u{00B7} Changed default timeframe from "today" to "next" to return more useful information by default',
        '*\\[0\\.10\\.0\\] 2021\\-08\\-07*\n' +
          '\u{00B7} Added indefinite end date option',
        '*\\[0\\.9\\.2\\] 2021\\-08\\-04*\n' +
          '\u{00B7} Fixed error with messages exceeding the maximum Telegram message length of 4096 by splitting them into separate messages',
        '*\\[0\\.9\\.1\\] 2021\\-08\\-01*\n' +
          '\u{00B7} Fixed incomplete results being returned when searching by "month" or "next month"',
        '*\\[0\\.9\\.0\\] 2021\\-07\\-28*\n' +
          '\u{00B7} Added /updates command to check the latest updates',
        '*\\[0\\.8\\.0\\] 2021\\-07\\-28*\n' +
          '\u{00B7} Added auto\\-expansion of recognised acronyms, e\\.g\\. "amk" to "ang mo kio", "tpy" to "toa payoh"',
      ];
      const expectedMessage = updateEntries.join('\n\n');

      await callBot(inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('expandable inputs', () => {
    let processSearchSpy: jest.SpyInstance;

    beforeEach(() => {
      processSearchSpy = jest
        .spyOn(searchLogic, 'processSearch')
        .mockReturnValue(Promise.resolve(Result.Err(new AWSError())));
    });

    afterEach(() => {
      processSearchSpy.mockRestore();
    });

    test('"tpy" should expand to "toa payoh"', async () => {
      const inputMessage = 'tpy lorong 5';

      await callBot(inputMessage);
      expect(processSearchSpy).toHaveBeenCalledWith('toa payoh lorong 5');
    });

    test('"amk" should expand to "ang mo kio"', async () => {
      const inputMessage = '10 amk';

      await callBot(inputMessage);
      expect(processSearchSpy).toHaveBeenCalledWith('10 ang mo kio');
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

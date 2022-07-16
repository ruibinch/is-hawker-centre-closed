/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as SearchLogicFile from '../../../src/bot/services/search/logic';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as ClosureFile from '../../../src/models/Closure';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import * as telegramMethods from '../../../src/telegram/methods';
import { mockClosures } from './__mocks__/db';
import { makeTelegramCallbackQuery } from './__mocks__/telegram';
import {
  assertBotResponse,
  assertBotCallbackResponse,
  assertInputSaved,
  makeBotWrapper,
} from './helpers';

describe('[bot] [integration] Callback queries', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let getUserByIdSpy: jest.SpyInstance;
  let dateSpy: jest.SpyInstance;
  let editMessageTextSpy: jest.SpyInstance;
  let answerCallbackQuerySpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;
  let getAllInputsSpy: jest.SpyInstance;
  let processSearchSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-01T11:30:25').valueOf());
  });

  beforeEach(() => {
    editMessageTextSpy = jest
      .spyOn(telegramMethods, 'editMessageText')
      .mockImplementation(() => Promise.resolve());
    answerCallbackQuerySpy = jest
      .spyOn(telegramMethods, 'answerCallbackQuery')
      .mockImplementation(() => Promise.resolve());
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    editMessageTextSpy.mockRestore();
    answerCallbackQuerySpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();

    getUserByIdSpy.mockRestore();
  });

  const inputWithinTimeThreshold = {
    inputId: '1-1609804800000000',
    userId: 1,
    username: 'ashketchum',
    text: 'month',
    createdAt: '2021-01-05T00:00:00.000Z',
  };

  const inputOutsideTimeThreshold = {
    inputId: '1-1609891200000000',
    userId: 1,
    username: 'ashketchum',
    text: 'month',
    createdAt: '2021-01-06T00:00:00.000Z',
  };

  describe('when data exists in DB', () => {
    beforeAll(() => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok([inputWithinTimeThreshold])),
        );
      getAllClosuresSpy = jest
        .spyOn(ClosureFile, 'getAllClosures')
        .mockImplementation(() => Promise.resolve(Result.Ok(mockClosures)));
    });

    afterAll(() => {
      getAllInputsSpy.mockRestore();
      getAllClosuresSpy.mockRestore();
    });

    it('correctly edits message and returns callback response', async () => {
      const callbackQueryData = '$searchPagination 3';
      const expectedMessage =
        'There are *8* hawker centres that are closed this month:\n\n' +
        '7\\. *Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_\n\n' +
        '8\\. *Slateport City*\n_tomorrow_';
      const expectedReplyMarkup = {
        inline_keyboard: [
          [
            { callback_data: '$searchPagination 1', text: '« 1' },
            { callback_data: '$searchPagination 2', text: '‹ 2' },
            { callback_data: '$searchPagination null', text: '[ 3 ]' },
          ],
        ],
      };

      await callBot(
        undefined,
        undefined,
        makeTelegramCallbackQuery({ data: callbackQueryData }),
      );

      assertInputSaved(addInputToDBSpy, '1609804800000::$searchPagination 3');
      assertBotResponse(editMessageTextSpy, {
        text: expectedMessage,
        reply_markup: expectedReplyMarkup,
      });
      assertBotCallbackResponse(answerCallbackQuerySpy);
    });
  });

  describe('error scenarios', () => {
    it('when query data is missing', async () => {
      const expectedMessage = 'No data found';

      await callBot(
        undefined,
        undefined,
        // @ts-expect-error data is optional
        makeTelegramCallbackQuery({ data: undefined }),
      );

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
    });

    it('when query data is null', async () => {
      await callBot(
        undefined,
        undefined,
        makeTelegramCallbackQuery({ data: '$searchPagination null' }),
      );

      assertBotCallbackResponse(answerCallbackQuerySpy);
    });

    it('when query data is unhandled', async () => {
      const expectedMessage = 'Error handling query';

      await callBot(
        undefined,
        undefined,
        makeTelegramCallbackQuery({ data: 'unhandled query data' }),
      );

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
    });

    it('when getAllInputs returns an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const expectedMessage = 'Error returning search results';
      await callBot(undefined, undefined, makeTelegramCallbackQuery());

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
      getAllInputsSpy.mockRestore();
    });

    it('when there is no matching input within the time threshold', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok([inputOutsideTimeThreshold])),
        );

      const expectedMessage = 'Error returning search results';
      await callBot(undefined, undefined, makeTelegramCallbackQuery());

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
      getAllInputsSpy.mockRestore();
    });

    it('when processSearch returns an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok([inputWithinTimeThreshold])),
        );
      processSearchSpy = jest
        .spyOn(SearchLogicFile, 'processSearch')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const expectedMessage = 'Error returning search results';
      await callBot(undefined, undefined, makeTelegramCallbackQuery());

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
      getAllInputsSpy.mockRestore();
      processSearchSpy.mockRestore();
    });
  });
});

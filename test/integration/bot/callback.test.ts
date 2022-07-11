/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as sender from '../../../src/bot/sender';
import * as searchLogic from '../../../src/bot/services/search/logic';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import { mockClosures, mockInputs } from './__mocks__/db';
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
      .spyOn(sender, 'editMessageText')
      .mockImplementation(() => Promise.resolve());
    answerCallbackQuerySpy = jest
      .spyOn(sender, 'answerCallbackQuery')
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
    text: 'littleroot',
    createdAt: '2021-01-05T00:00:00.000Z',
  };

  const inputOutsideTimeThreshold = {
    inputId: '1-1609891200000000',
    userId: 1,
    username: 'ashketchum',
    text: 'littleroot',
    createdAt: '2021-01-06T00:00:00.000Z',
  };

  describe('when data exists in DB', () => {
    beforeAll(() => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok([inputWithinTimeThreshold])),
        );
      processSearchSpy = jest
        .spyOn(searchLogic, 'processSearch')
        .mockImplementation(() =>
          Promise.resolve(
            Result.Ok({
              params: { keyword: 'littleroot', modifier: 'next' },
              hasResults: true,
              closures: [],
            }),
          ),
        );
    });

    afterAll(() => {
      getAllInputsSpy.mockRestore();
      processSearchSpy.mockRestore();
    });

    it('correctly edits message and returns callback response', async () => {
      const callbackQueryData = '$searchPagination 2';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* and their next closure dates:\n\n';

      await callBot(
        undefined,
        undefined,
        makeTelegramCallbackQuery({ data: callbackQueryData }),
      );

      assertInputSaved(addInputToDBSpy, '1609804800000::$searchPagination 2');
      assertBotResponse(editMessageTextSpy, { text: expectedMessage });
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
        .spyOn(searchLogic, 'processSearch')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const expectedMessage = 'Error returning search results';
      await callBot(undefined, undefined, makeTelegramCallbackQuery());

      assertBotCallbackResponse(answerCallbackQuerySpy, expectedMessage);
      getAllInputsSpy.mockRestore();
      processSearchSpy.mockRestore();
    });
  });
});

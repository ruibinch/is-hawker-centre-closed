/* eslint-disable max-len */
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import * as Result from '../src/models/Result';
import { mockResults } from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

jest.mock('../src/bot/variables', () => ({
  BOT_TOKEN: 'pokemongottacatchthemall',
}));

describe('Search module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getAllResultsSpy: jest.SpyInstance;

  beforeAll(() => {
    const results = { Items: mockResults } as unknown;
    getAllResultsSpy = jest
      .spyOn(Result, 'getAllResults')
      .mockImplementation(
        () =>
          Promise.resolve(results) as Promise<
            PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
          >,
      );
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
    getAllResultsSpy.mockRestore();
  });

  describe('when data exists in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["littleroot"] returns a single result occurring today', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* that are closed today:\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('littleroot');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["littleroot today"] returns a single result occurring today', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* that are closed today:\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('littleroot today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["rustboro"] does not return any result if there is no result occurring today', async () => {
      const expectedMessage =
        'All good\\! No hawker centres containing the keyword *rustboro* are undergoing cleaning today\\.';

      await callBot('rustboro');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tmr"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n' +
        '\n' +
        '*Slateport City*\n' +
        '02\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('slateport tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tomorrow"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n' +
        '\n' +
        '*Slateport City*\n' +
        '02\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('slateport tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["oldale month"] returns results occurring in the current month', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *oldale* that are closed this month:\n' +
        '\n' +
        '*Oldale Town*\n' +
        '15\\-Jan to 18\\-Jan\n' +
        '\n' +
        '*Oldale Town*\n' +
        '30\\-Jan to 31\\-Jan\n' +
        '\n';

      await callBot('oldale month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["verdanturf next month"] returns results occurring in the next month', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *verdanturf* that will be closed next month:\n' +
        '\n' +
        '*Verdanturf Town*\n' +
        '08\\-Feb to 09\\-Feb\n' +
        '\n';

      await callBot('verdanturf next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next month"] returns results occurring in the next month with the long-term renovation works suffix', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville* that will be closed next month:\n' +
        '\n' +
        '*Melville City*\n' +
        '01\\-Feb to 28\\-Feb _\\(long\\-term renovation works\\)_\n' +
        '\n';

      await callBot('melville next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Today"] returns all results occurring today', async () => {
      const expectedMessage =
        'There are *2* hawker centres that are closed today:\n' +
        '\n' +
        '*Melville City*\n' +
        '01\\-Jan to 01\\-Jan\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        'There are *2* hawker centres that will be closed tomorrow:\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n' +
        '*Slateport City*\n' +
        '02\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        'There are *2* hawker centres that will be closed tomorrow:\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n' +
        '*Slateport City*\n' +
        '02\\-Jan to 02\\-Jan\n' +
        '\n';

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all results occurring in the current month', async () => {
      const expectedMessage =
        'There are *5* hawker centres that are closed this month:\n' +
        '\n' +
        '*Melville City*\n' +
        '01\\-Jan to 01\\-Jan\n' +
        '\n' +
        '*Littleroot Town*\n' +
        '01\\-Jan to 02\\-Jan\n' +
        '\n' +
        '*Slateport City*\n' +
        '02\\-Jan to 02\\-Jan\n' +
        '\n' +
        '*Oldale Town*\n' +
        '15\\-Jan to 18\\-Jan\n' +
        '\n' +
        '*Oldale Town*\n' +
        '30\\-Jan to 31\\-Jan\n' +
        '\n';

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all results occurring in the current month', async () => {
      const expectedMessage =
        'There are *3* hawker centres that will be closed next month:\n' +
        '\n' +
        '*Melville City*\n' +
        '01\\-Feb to 28\\-Feb _\\(long\\-term renovation works\\)_\n' +
        '\n' +
        '*Rustboro City*\n' +
        '02\\-Feb to 05\\-Feb\n' +
        '\n' +
        '*Verdanturf Town*\n' +
        '08\\-Feb to 09\\-Feb\n' +
        '\n';

      await callBot('Next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('when data does not exist in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-03-01').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["Today"] returns no results', async () => {
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning today\\.';

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns no results', async () => {
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns no results', async () => {
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns no results', async () => {
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning this month\\.';

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns no results', async () => {
      const expectedMessage =
        'No data is available for next month yet, check back again in a while\\!';

      await callBot('Next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

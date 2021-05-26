/* eslint-disable max-len */
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import * as Result from '../src/models/Result';
import * as User from '../src/models/User';
import { mockResults, mockUsers } from './__mocks__/db';
import { assertBotResponse, makeNotificationsWrapper } from './helpers/bot';

describe('Notifications module', () => {
  const mockCallback = jest.fn();
  const callNotifications = makeNotificationsWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;

  // dynamodb mocks
  let getAllUsersSpy: jest.SpyInstance;
  let getAllResultsSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-02-08').valueOf());

    const users = { Items: mockUsers } as unknown;
    getAllUsersSpy = jest
      .spyOn(User, 'getAllUsers')
      .mockImplementation(
        () =>
          Promise.resolve(users) as Promise<
            PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
          >,
      );

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
    dateSpy.mockRestore();

    getAllUsersSpy.mockRestore();
    getAllResultsSpy.mockRestore();
  });

  it('sends a notification to users who with a favourite hawker centre that is closed today', async () => {
    const expectedMessages = [
      t('notifications.overview.singular', {
        emoji: '\u{1F4A1}',
        numHC: 1,
      }) +
        t('notifications.item', {
          hcName: 'Verdanturf Town',
          startDate: 'today',
          endDate: 'tomorrow',
          closureReasonSnippet: '',
        }),
      t('notifications.overview.singular', {
        emoji: '\u{1F4A1}',
        numHC: 1,
      }) +
        t('notifications.item', {
          hcName: 'Melville City',
          startDate: '01\\-Feb',
          endDate: '28\\-Feb',
          closureReasonSnippet: ' _\\(long\\-term renovation works\\)_',
        }),
    ];

    await callNotifications();

    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    expectedMessages.forEach((expectedMessage) => {
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

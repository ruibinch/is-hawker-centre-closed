/* eslint-disable max-len */
import { parseISO } from 'date-fns';
import { Err, Ok, Result } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import { initDictionary, t } from '../src/lang';
import * as ClosureFile from '../src/models/Closure';
import { Closure, User } from '../src/models/types';
import * as UserFile from '../src/models/User';
import { mockClosures, mockUsers } from './__mocks__/db';
import { assertBotResponse, makeNotificationsWrapper } from './helpers/bot';

describe('Notifications module', () => {
  const mockCallback = jest.fn();
  const callNotifications = makeNotificationsWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;

  // dynamodb mocks
  let getAllUsersSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-02-08').valueOf());
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();

    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(
        () =>
          Promise.resolve(Ok(mockUsers)) as Promise<Result<User[], AWSError>>,
      );

    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(
        () =>
          Promise.resolve(Ok(mockClosures)) as Promise<
            Result<Closure[], AWSError>
          >,
      );
  });

  afterEach(() => {
    mockCallback.mockRestore();
    sendMessageSpy.mockRestore();

    getAllUsersSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
  });

  afterAll(() => {
    dateSpy.mockRestore();
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
          closureReason: '',
        }),
      t('notifications.overview.singular', {
        emoji: '\u{1F4A1}',
        numHC: 1,
      }) +
        t('notifications.item', {
          hcName: 'Melville City',
          startDate: '01\\-Feb',
          endDate: '28\\-Feb',
          closureReason: ' _\\(long\\-term renovation works\\)_',
        }),
    ];

    await callNotifications();

    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    expectedMessages.forEach((expectedMessage) => {
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  it('returns an error 400 when getAllUsers fails', async () => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(
        () =>
          Promise.resolve(Err(new AWSError())) as Promise<
            Result<User[], AWSError>
          >,
      );

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: '',
      statusCode: 400,
    });
  });

  it('returns an error 400 when getAllClosures fails', async () => {
    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(
        () =>
          Promise.resolve(Err(new AWSError())) as Promise<
            Result<Closure[], AWSError>
          >,
      );

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: '',
      statusCode: 400,
    });
  });
});

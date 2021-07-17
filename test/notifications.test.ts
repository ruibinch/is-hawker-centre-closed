/* eslint-disable max-len */
import { parseISO } from 'date-fns';
import { Err, Ok } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as ClosureFile from '../src/models/Closure';
import * as UserFile from '../src/models/User';
import { mockClosures, mockUsers } from './__mocks__/db';
import { assertBotResponse, makeNotificationsWrapper } from './helpers';

describe('Notifications module', () => {
  const mockCallback = jest.fn();
  const callNotifications = makeNotificationsWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;

  // dynamodb mocks
  let getUserByIdSpy: jest.SpyInstance;
  let getAllUsersSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-02-08T11:30:25').valueOf());
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Ok(mockUsers)));

    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Ok(mockClosures)));
  });

  afterEach(() => {
    mockCallback.mockRestore();
    sendMessageSpy.mockRestore();

    getAllUsersSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
  });

  afterAll(() => {
    dateSpy.mockRestore();
    getUserByIdSpy.mockRestore();
  });

  it('sends a notification to users in their preferred language with a favourite hawker centre that is closed today', async () => {
    const expectedMessages = [
      '\u{1F4A1} Heads up\\! 1 of your favourite hawker centres will be closed today\\.\n\n' +
        '*Verdanturf Town*\n\\(today to tomorrow\\)',
      '\u{1F4A1} 注意！今天有1个您喜爱的小贩中心关闭。\n\n' +
        '*Melville City*\n（2月1日至2月28日; 其他工程）',
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
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

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
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: '',
      statusCode: 400,
    });
  });
});

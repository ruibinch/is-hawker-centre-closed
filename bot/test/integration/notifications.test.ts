/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import { Result } from '../../../lib/Result';
import * as sender from '../../src/bot/sender';
import { AWSError } from '../../src/errors/AWSError';
import * as discord from '../../src/ext/discord';
import * as ClosureFile from '../../src/models/Closure';
import * as UserFile from '../../src/models/User';
import { mockClosures, mockUsers } from './__mocks__/db';
import { assertBotResponse, makeNotificationsWrapper } from './helpers';

describe('[integration] Notifications module', () => {
  const mockCallback = jest.fn();
  const callNotifications = makeNotificationsWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let sendDiscordAdminMessageSpy: jest.SpyInstance;

  // dynamodb mocks
  let getAllUsersSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-02-08T11:30:25').valueOf());
  });

  beforeEach(() => {
    sendMessageSpy = jest
      .spyOn(sender, 'sendMessage')
      .mockImplementation(() => Promise.resolve());
    sendDiscordAdminMessageSpy = jest
      .spyOn(discord, 'sendDiscordAdminMessage')
      .mockImplementation();

    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockUsers)));

    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockClosures)));
  });

  afterEach(() => {
    mockCallback.mockRestore();
    sendMessageSpy.mockRestore();
    sendDiscordAdminMessageSpy.mockRestore();

    getAllUsersSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  it('sends a notification to users in their preferred language regarding their favourite hawker centre(s) that is/are closed today', async () => {
    const expectedMessages = [
      '\u{1F4A1} Heads up\\! 1 of your favourite hawker centres will be closed today\\.\n\n' +
        '*Verdanturf Town*\n_today to tomorrow_',
      '\u{1F4A1} 注意！今天有2个您喜爱的小贩中心关闭。\n\n' +
        '*Verdanturf Town*\n _今天至明天_\n\n' +
        '*Melville City*\n _2月1日至2月28日; 其他工程_',
    ];

    await callNotifications();

    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    expect(sendDiscordAdminMessageSpy).toHaveBeenCalled();
    expectedMessages.forEach((expectedMessage) => {
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  it('returns an error 400 when getAllUsers fails', async () => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(sendDiscordAdminMessageSpy).not.toHaveBeenCalled();
  });

  it('returns an error 400 when getAllClosures fails', async () => {
    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(sendDiscordAdminMessageSpy).not.toHaveBeenCalled();
  });
});

/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import * as Closure from '../src/models/Closure';
import { GetAllClosuresResponse } from '../src/models/Closure';
import * as User from '../src/models/User';
import { GetAllUsersResponse } from '../src/models/User';
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

    const users = { success: true, output: mockUsers } as unknown;
    getAllUsersSpy = jest
      .spyOn(User, 'getAllUsers')
      .mockImplementation(
        () => Promise.resolve(users) as Promise<GetAllUsersResponse>,
      );

    const closures = { success: true, output: mockClosures } as unknown;
    getAllClosuresSpy = jest
      .spyOn(Closure, 'getAllClosures')
      .mockImplementation(
        () => Promise.resolve(closures) as Promise<GetAllClosuresResponse>,
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
      .spyOn(User, 'getAllUsers')
      .mockImplementation(
        () =>
          Promise.resolve({ success: false }) as Promise<GetAllUsersResponse>,
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
      .spyOn(Closure, 'getAllClosures')
      .mockImplementation(
        () =>
          Promise.resolve({
            success: false,
          }) as Promise<GetAllClosuresResponse>,
      );

    await callNotifications();

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: '',
      statusCode: 400,
    });
  });
});

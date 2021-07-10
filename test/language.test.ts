import { parseISO } from 'date-fns';
import { Err, Ok } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as UserFile from '../src/models/User';
import * as favouritesIndex from '../src/services/favourites/index';
import { mockUser } from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Language module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let updateUserLanguageCodeSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Err.EMPTY));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

    updateUserLanguageCodeSpy = jest
      .spyOn(UserFile, 'updateUserLanguageCode')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    getUserByIdSpy.mockRestore();
    updateUserLanguageCodeSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
  });

  it('["/language"] returns the explanatory message', async () => {
    const expectedMessage =
      'To toggle your preferred language option, type in "_/language `[languageCode]`_"\\.\n\n' +
      'Supported language codes are:\n' +
      '_en_, _zh_';

    await callBot('/language');
    assertBotResponse(sendMessageSpy, expectedMessage);
  });

  it('["/language invalid"] returns an error message when the language code is invalid', async () => {
    const expectedMessage =
      'Invalid language code\\.\nPlease try again with either _en_ or _zh_\\.';

    await callBot('/language invalid');
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(updateUserLanguageCodeSpy).not.toHaveBeenCalled();
  });

  describe('new user', () => {
    let addUserSpy: jest.SpyInstance;

    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Err(new AWSError())));
    });

    beforeEach(() => {
      addUserSpy = jest
        .spyOn(UserFile, 'addUser')
        .mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      addUserSpy.mockRestore();
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    it('["/language en"] creates a new user with the preferred language setting', async () => {
      const expectedMessage =
        'Your language option has been set to *English*\\.';

      await callBot('/language en');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserLanguageCodeSpy).not.toHaveBeenCalled();
      expect(addUserSpy).toHaveBeenCalledWith({
        userId: 1,
        username: 'ashketchum',
        languageCode: 'en',
        favourites: [],
        isInFavouritesMode: false,
        notifications: true,
        createdAt: '2021-01-05T00:00:00Z',
      });
    });

    it('["/language zh"] creates a new user with the preferred language setting', async () => {
      const expectedMessage = '您的语言设置为*中文*。';

      await callBot('/language zh');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserLanguageCodeSpy).not.toHaveBeenCalled();
      expect(addUserSpy).toHaveBeenCalledWith({
        userId: 1,
        username: 'ashketchum',
        languageCode: 'zh',
        favourites: [],
        isInFavouritesMode: false,
        notifications: true,
        createdAt: '2021-01-05T00:00:00Z',
      });
    });
  });

  describe('existing user', () => {
    beforeEach(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Ok(mockUser)));
    });

    afterEach(() => {
      getUserByIdSpy.mockRestore();
    });

    it('["/language en"] successfully updates the preferred language setting', async () => {
      const expectedMessage =
        'Your language option has been set to *English*\\.';

      await callBot('/language en');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserLanguageCodeSpy).toHaveBeenCalledWith(1, 'en');
    });

    it('["/language zh"] successfully updates the preferred language setting', async () => {
      const expectedMessage = '您的语言设置为*中文*。';

      await callBot('/language zh');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserLanguageCodeSpy).toHaveBeenCalledWith(1, 'zh');
    });
  });
});

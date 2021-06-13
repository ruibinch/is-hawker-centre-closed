import { parseISO } from 'date-fns';
import { Err } from 'ts-results';

import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import * as User from '../src/models/User';
import * as favouritesIndex from '../src/services/favourites/index';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Feedback module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let updateUserLanguageCodeSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Err.EMPTY));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    updateUserLanguageCodeSpy = jest
      .spyOn(User, 'updateUserLanguageCode')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    updateUserLanguageCodeSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
  });

  it('["/language"] returns the explanatory message', async () => {
    const expectedMessage =
      t('language.command-language.explanation.first') +
      t('language.command-language.explanation.second') +
      t('language.command-language.explanation.third');

    await callBot('/language');
    assertBotResponse(sendMessageSpy, expectedMessage);
  });

  it('["/language en"] successfully updates the preferred language setting', async () => {
    const expectedMessage = t('language.updated');

    await callBot('/language en');
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(updateUserLanguageCodeSpy).toHaveBeenCalledWith(1, 'en');
  });

  it('["/language zh"] successfully updates the preferred language setting', async () => {
    const expectedMessage = t('language.updated');

    await callBot('/language zh');
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(updateUserLanguageCodeSpy).toHaveBeenCalledWith(1, 'zh');
  });

  it('["/language invalid"] returns an error message when the language code is invalid', async () => {
    const expectedMessage = t('language.error-updating');

    await callBot('/language invalid');
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(updateUserLanguageCodeSpy).not.toHaveBeenCalled();
  });
});

/* eslint-disable max-len */
import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('General module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);
  let sendMessageSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
  });

  describe('/start', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        t('general.command-start.explanation.first', {
          emojis: '\u{1F35C}\u{1F35B}\u{1F367}',
        }) +
        t('general.command-start.explanation.second', {
          example: 'bedok',
        }) +
        t('general.command-start.explanation.third');

      await callBot('/start');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('/help', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        t('general.command-help.explanation.search-section.first', {
          emoji: '\u{1F50D}',
        }) +
        t('general.command-help.explanation.search-section.second') +
        t('general.command-help.explanation.search-section.third') +
        t('general.command-help.explanation.search-section.fourth') +
        t('general.command-help.explanation.search-section.fifth') +
        t('general.command-help.explanation.search-section.sixth') +
        t('general.command-help.explanation.search-section.seventh', {
          example: t('search.example-format', {
            searchTerm: 'bedok',
            keyword: 'bedok',
            modifier: 'today',
          }),
        }) +
        t('general.command-help.explanation.favourites-section.first', {
          emoji: '\u{1F31F}',
        }) +
        t('general.command-help.explanation.favourites-section.second') +
        t('general.command-help.explanation.favourites-section.third') +
        t('general.command-help.explanation.favourites-section.fourth') +
        t('general.command-help.explanation.language-section.first', {
          emoji: '\u{1F4AC}',
        }) +
        t('general.command-help.explanation.language-section.second');

      await callBot('/help');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('empty input', () => {
    it('returns the correct message', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-empty'),
      });

      await callBot('');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('an unsupported command', () => {
    it('returns the correct message', async () => {
      const expectedMessage =
        t('general.error.unsupported-command.first') +
        t('general.error.unsupported-command.second', {
          commands:
            '/start, /help, /list, /fav, /del, /notify, /language, /feedback',
        });

      await callBot('/invalid');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

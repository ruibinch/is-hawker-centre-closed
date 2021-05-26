import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { bot } from '../src/bot/handler';
import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import * as searchFeature from '../src/services/search';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Validation module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);
  let sendMessageSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();
  });

  afterAll(() => {
    mockCallback.mockRestore();
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  describe('non-text messages', () => {
    it('sends an emoji', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-emoji'),
      });

      await callBot('😊');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a bunch of gibberish that will be removed after sanitisation', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-empty'),
      });

      await callBot('!@#$%^&*{}[]<>,.?\\|:;"-+=');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a gif', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-gif'),
      });

      await callBot(undefined, {
        animation: { file: 'value' },
        document: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an animation', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-animation'),
      });

      await callBot(undefined, {
        animation: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an audio message', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-audio'),
      });

      await callBot(undefined, {
        audio: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a voice message', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-audio'),
      });

      await callBot(undefined, {
        voice: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a document', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-document'),
      });

      await callBot(undefined, {
        document: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a location', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-location'),
      });

      await callBot(undefined, {
        location: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a photo', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-photo'),
      });

      await callBot(undefined, {
        photo: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a sticker', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-sticker'),
      });

      await callBot(undefined, {
        sticker: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a video', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-video'),
      });

      await callBot(undefined, {
        video: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends any other message type', async () => {
      const expectedMessage = t('validation.error.base-message-format', {
        emoji: '\u{2757}',
        errorMessage: t('validation.error.message-type-unknown'),
      });

      await callBot(undefined, {
        contact: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('invalid message format', () => {
    it('sends a message with a missing token', async () => {
      const result = await bot(
        {} as APIGatewayProxyEvent,
        {} as Context,
        mockCallback,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.statusCode).toStrictEqual(403);
      }
    });

    it('sends a message with a missing body', async () => {
      const event: APIGatewayProxyEvent = ({
        queryStringParameters: {
          token: 'pokemongottacatchthemall',
        },
      } as unknown) as APIGatewayProxyEvent;

      const result = await bot(event, {} as Context, mockCallback);

      expect(result).toBeDefined();
      if (result) {
        expect(result.statusCode).toStrictEqual(400);
      }
    });
  });

  describe('error scenario', () => {
    let runSearchSpy: jest.SpyInstance;

    beforeEach(() => {
      runSearchSpy = jest
        .spyOn(searchFeature, 'runSearch')
        .mockReturnValue(Promise.resolve(null));
    });

    afterEach(() => {
      runSearchSpy.mockRestore();
    });

    it('returns the defined generic error message', async () => {
      const expectedMessage = t('validation.error.generic');

      await callBot('any input');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

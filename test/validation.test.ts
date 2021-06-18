import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Err } from 'ts-results';

import { bot } from '../src/bot/handler';
import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as UserFile from '../src/models/User';
import * as searchFeature from '../src/services/search';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Validation module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));
  });

  afterAll(() => {
    mockCallback.mockRestore();
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    getUserByIdSpy.mockRestore();
  });

  describe('non-text messages', () => {
    it('sends an emoji', async () => {
      const expectedMessage =
        "\u{2757} That's a cute emoji but this bot has no idea which hawker centre that could refer to\\.\n\n" +
        'Please try again with a text message\\.';

      await callBot('😊');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a bunch of gibberish that will be removed after sanitisation', async () => {
      const expectedMessage =
        '\u{2757} No text found\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot('!@#$%^&*{}[]<>,.?\\|:;"-+=');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a gif', async () => {
      const expectedMessage =
        '\u{2757} Not sure how to interpret this gif\\.\\.\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        animation: { file: 'value' },
        document: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an animation', async () => {
      const expectedMessage =
        '\u{2757} Not sure how to interpret this animation\\.\\.\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        animation: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an audio message', async () => {
      const expectedMessage =
        '\u{2757} Speech\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        audio: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a voice message', async () => {
      const expectedMessage =
        '\u{2757} Speech\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        voice: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a document', async () => {
      const expectedMessage =
        "\u{2757} This is just a humble bot, it can't understand a whole document\\!\n\n" +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        document: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a location', async () => {
      const expectedMessage =
        '\u{2757} Searching by coordinates is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        location: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a photo', async () => {
      const expectedMessage =
        '\u{2757} Image\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        photo: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a sticker', async () => {
      const expectedMessage =
        '\u{2757} Not sure how to interpret this sticker\\.\\.\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        sticker: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a video', async () => {
      const expectedMessage =
        '\u{2757} If images are too advanced for this bot, videos are definitely out of the question\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        video: { file: 'value' },
      });
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends any other message type', async () => {
      const expectedMessage =
        '\u{2757} No idea what this message is about\\!\n\n' +
        'Please try again with a text message\\.';

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
      const event: APIGatewayProxyEvent = {
        queryStringParameters: {
          token: 'pokemongottacatchthemall',
        },
      } as unknown as APIGatewayProxyEvent;

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
        .mockReturnValue(Promise.resolve(Err.EMPTY));
    });

    afterEach(() => {
      runSearchSpy.mockRestore();
    });

    it('returns the defined generic error message', async () => {
      const expectedMessage =
        'Woops, an unexpected error occurred\\. You can report this issue using the /feedback command\\.';

      await callBot('any input');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

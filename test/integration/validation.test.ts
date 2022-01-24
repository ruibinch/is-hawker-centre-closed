/* eslint-disable max-len */
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

import { bot } from '../../src/bot/handler';
import * as sender from '../../src/bot/sender';
import { AWSError } from '../../src/errors/AWSError';
import { Result } from '../../src/lib/Result';
import * as InputFile from '../../src/models/Input';
import * as UserFile from '../../src/models/User';
import * as searchFeature from '../../src/services/search';
import { assertBotResponse, makeBotWrapper } from './helpers';

describe('[integration] Validation module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
  });

  beforeEach(() => {
    sendMessageSpy = jest
      .spyOn(sender, 'sendMessage')
      .mockImplementation(() => Promise.resolve());
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();

    getUserByIdSpy.mockRestore();
  });

  describe('non-text messages', () => {
    it('sends an emoji', async () => {
      const expectedMessage =
        "\u{2757} That's a cute emoji but this bot has no idea which hawker centre that could refer to\\.\n\n" +
        'Please try again with a text message\\.';

      await callBot('😊');
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a bunch of gibberish that will be removed after sanitisation', async () => {
      const expectedMessage =
        '\u{2757} No text found\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot('!@#$%^&*{}[]<>,.?\\|:;"-+=');
      expect(addInputToDBSpy).not.toHaveBeenCalled();
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
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an animation', async () => {
      const expectedMessage =
        '\u{2757} Not sure how to interpret this animation\\.\\.\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        animation: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends an audio message', async () => {
      const expectedMessage =
        '\u{2757} Speech\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        audio: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a voice message', async () => {
      const expectedMessage =
        '\u{2757} Speech\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        voice: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a document', async () => {
      const expectedMessage =
        "\u{2757} This is just a humble bot, it can't understand a whole document\\!\n\n" +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        document: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a location', async () => {
      const expectedMessage =
        '\u{2757} Searching by coordinates is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        location: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a photo', async () => {
      const expectedMessage =
        '\u{2757} Image\\-to\\-text technology is too advanced for this bot\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        photo: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a sticker', async () => {
      const expectedMessage =
        '\u{2757} Not sure how to interpret this sticker\\.\\.\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        sticker: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends a video', async () => {
      const expectedMessage =
        '\u{2757} If images are too advanced for this bot, videos are definitely out of the question\\.\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        video: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('sends any other message type', async () => {
      const expectedMessage =
        '\u{2757} No idea what this message is about\\!\n\n' +
        'Please try again with a text message\\.';

      await callBot(undefined, {
        contact: { file: 'value' },
      });
      expect(addInputToDBSpy).not.toHaveBeenCalled();
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
        // type assertion required as Sentry.wrapHandler prevents the return result from being correctly inferred
        expect((result as APIGatewayProxyResult).statusCode).toStrictEqual(403);
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
        // type assertion required as Sentry.wrapHandler prevents the return result from being correctly inferred
        expect((result as APIGatewayProxyResult).statusCode).toStrictEqual(400);
      }
    });
  });

  describe('non-direct messages', () => {
    it('does not send a reply when the update represents the bot being added to a group channel (my_chat_member is defined)', async () => {
      await callBot(undefined, undefined, {
        update_id: 111,
        my_chat_member: { data: 'value' },
      });

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('does not send a reply when the update represents the bot being added to a group channel (chat_member is defined)', async () => {
      await callBot(undefined, undefined, {
        update_id: 111,
        chat_member: { data: 'value' },
      });

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('does not send a reply when the message represents the bot being added to a group channel', async () => {
      await callBot(undefined, {
        new_chat_members: [{ data: 'value' }],
      });

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('does not send a reply when the message represents the bot being removed from a group channel', async () => {
      await callBot(undefined, {
        left_chat_member: [{ data: 'value' }],
      });

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('error scenario', () => {
    let runSearchSpy: jest.SpyInstance;

    beforeEach(() => {
      runSearchSpy = jest
        .spyOn(searchFeature, 'runSearch')
        .mockReturnValue(Promise.resolve(Result.Err()));
    });

    afterEach(() => {
      runSearchSpy.mockRestore();
    });

    it('returns the defined generic error message', async () => {
      const expectedMessage =
        'Woops, an unexpected error occurred\\. Try again?';

      await callBot('any input');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

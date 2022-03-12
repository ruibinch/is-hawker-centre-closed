import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { bot } from '../../../src/bot/handlers/bot';
import { handler as notificationsTriggerHandler } from '../../../src/bot/handlers/notificationsTrigger';
import type {
  TelegramMessage,
  TelegramUpdate,
} from '../../../src/bot/telegram';
import { makeTelegramMessage } from '../__mocks__/telegram';

export const makeBotWrapper =
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCallback: jest.Mock<any, any>,
  ) =>
  async (
    inputText?: string,
    otherMessageParams: Partial<TelegramMessage> = {},
    telegramUpdateParams?: TelegramUpdate,
  ): Promise<void> => {
    const event = {
      body: JSON.stringify(
        telegramUpdateParams ??
          makeTelegramMessage({ text: inputText, ...otherMessageParams }),
      ),
      queryStringParameters: {
        token: 'pokemongottacatchthemall',
      },
    } as unknown as APIGatewayProxyEvent;

    await bot(event, {} as Context, mockCallback);
  };

export const makeNotificationsWrapper =
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCallback: jest.Mock<any, any>,
  ) =>
  async (): Promise<void> => {
    await notificationsTriggerHandler(
      {} as APIGatewayProxyEvent,
      {} as Context,
      mockCallback,
    );
  };

export const assertBotResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spy: jest.SpyInstance<any, any>,
  expectedMessage: string,
  expectedChoices?: string[],
): void => {
  const expectedObject: {
    message: string;
    choices?: string[];
  } = {
    message: expectedMessage,
  };

  if (expectedChoices) {
    expectedObject.choices = expectedChoices;
  }

  expect(spy).toHaveBeenCalledWith(expect.objectContaining(expectedObject));
};

export const assertInputSaved = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spy: jest.SpyInstance<any, any>,
  inputMessage: string,
): void => {
  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({
      text: inputMessage,
    }),
  );
};

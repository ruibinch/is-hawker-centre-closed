import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { handler as botHandler } from '../../../../src/bot/handlers/bot';
import { handler as notificationsTriggerHandler } from '../../../../src/bot/handlers/notificationsTrigger';
import { answerCallbackQuery } from '../../../../src/bot/sender';
import type {
  TelegramMessage,
  TelegramSendMessageParams,
  TelegramUpdate,
} from '../../../../src/telegram';
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

    await botHandler(event, {} as Context, mockCallback);
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
  expectedMessageProps: string | TelegramSendMessageParams,
  expectedChoices?: string[],
): void => {
  const expectedObject: {
    message?: string;
    messageParams?: TelegramSendMessageParams;
    choices?: string[];
  } =
    typeof expectedMessageProps === 'string'
      ? {
          message: expectedMessageProps,
        }
      : {
          messageParams: expectedMessageProps,
        };

  if (expectedChoices) {
    expectedObject.choices = expectedChoices;
  }

  expect(spy).toHaveBeenCalledWith(expect.objectContaining(expectedObject));
};

export const assertBotCallbackResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spy: jest.SpyInstance<any, any>,
  expectedMessage?: string,
): void => {
  const expectedObject: Parameters<typeof answerCallbackQuery>[0] = {
    queryId: '9876543210',
  };
  if (expectedMessage) {
    expectedObject.text = expectedMessage;
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

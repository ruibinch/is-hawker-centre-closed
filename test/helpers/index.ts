import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { bot } from '../../src/bot/handler';
import { handler as notificationsTriggerHandler } from '../../src/triggers/notificationsTrigger';
import { TelegramMessage } from '../../src/utils/telegram';
import { makeTelegramMessage } from '../__mocks__/telegram';

export const makeBotWrapper =
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCallback: jest.Mock<any, any>,
  ) =>
  async (
    inputText?: string,
    otherMessageParams: Partial<TelegramMessage> = {},
  ): Promise<void> => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify(
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
  const expectedObject = {
    message: expectedMessage,
    choices: expectedChoices,
  };
  if (expectedObject.choices === undefined) {
    delete expectedObject.choices;
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

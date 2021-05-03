import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { bot } from '../../src/bot/handler';
import { makeTelegramMessage } from '../__mocks__/telegram';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeBotWrapper = (mockCallback: jest.Mock<any, any>) => async (
  inputMessage: string,
): Promise<void> => {
  const event: APIGatewayProxyEvent = ({
    body: JSON.stringify(makeTelegramMessage({ text: inputMessage })),
    queryStringParameters: {
      token: 'pokemongottacatchthemall',
    },
  } as unknown) as APIGatewayProxyEvent;

  await bot(event, {} as Context, mockCallback);
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

  expect(spy).toBeCalledWith(expect.objectContaining(expectedObject));
};

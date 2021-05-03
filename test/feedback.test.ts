import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import * as Feedback from '../src/models/Feedback';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

jest.mock('../src/bot/variables', () => ({
  BOT_TOKEN: 'pokemongottacatchthemall',
}));

describe('Feedback module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let addFeedbackToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    addFeedbackToDBSpy = jest
      .spyOn(Feedback, 'addFeedbackToDB')
      .mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
  });

  it('["/feedback"] returns the explanatory message', async () => {
    const expectedMessage =
      'Type in your feedback after a /feedback command\\.\n\n' +
      'e\\.g\\. _/feedback Bot icon is ugly_';

    await callBot('/feedback');
    assertBotResponse(sendMessageSpy, expectedMessage);
  });

  it('["/feedback great bot"] successfully adds a feedback entry', async () => {
    const expectedMessage = 'Got it, thanks for your feedback\\!';

    await callBot('/feedback great bot');
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(addFeedbackToDBSpy).toHaveBeenCalledWith({
      feedbackId: `1-${new Date('2021-01-05').getTime()}`,
      userId: 1,
      username: 'ashketchum',
      text: 'great bot',
      dateSubmitted: '2021-01-05T00:00:00Z',
    });
  });
});

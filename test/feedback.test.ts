import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import * as favouritesIndex from '../src/features/favourites/index';
import { initDictionary, t } from '../src/lang';
import * as Feedback from '../src/models/Feedback';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Feedback module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let addFeedbackToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve({ success: false }));
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
    maybeHandleFavouriteSelectionSpy.mockRestore();
  });

  it('["/feedback"] returns the explanatory message', async () => {
    const expectedMessage =
      t('feedback.command-feedback.explanation.first') +
      t('feedback.command-feedback.explanation.second', {
        example: 'Bot icon is ugly',
      });

    await callBot('/feedback');
    assertBotResponse(sendMessageSpy, expectedMessage);
  });

  it('["/feedback great bot"] successfully adds a feedback entry', async () => {
    const expectedMessage = t('feedback.feedback-added');

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

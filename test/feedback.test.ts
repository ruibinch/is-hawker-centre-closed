import { parseISO } from 'date-fns';
import { Err } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import { t } from '../src/lang';
import * as Feedback from '../src/models/Feedback';
import * as UserFile from '../src/models/User';
import * as favouritesIndex from '../src/services/favourites/index';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Feedback module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let addFeedbackToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Err.EMPTY));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    addFeedbackToDBSpy = jest
      .spyOn(Feedback, 'addFeedbackToDB')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
    getUserByIdSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
  });

  it('["/feedback"] returns the explanatory message', async () => {
    const expectedMessage =
      'Type in your feedback after a /feedback command\\.\n\n' +
      'e\\.g\\. _/feedback Bot icon is ugly_';

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
    });
  });
});

import { parseISO } from 'date-fns';

import { Result } from '../../../lib/Result';
import * as sender from '../../src/bot/sender';
import { AWSError } from '../../src/errors/AWSError';
import * as Feedback from '../../src/models/Feedback';
import * as InputFile from '../../src/models/Input';
import * as UserFile from '../../src/models/User';
import * as favouritesIndex from '../../src/services/favourites/index';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('[integration] Feedback module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let addFeedbackToDBSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Result.Err()));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    addFeedbackToDBSpy = jest
      .spyOn(Feedback, 'addFeedbackToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    addFeedbackToDBSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();

    getUserByIdSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
  });

  it('["/feedback"] returns the explanatory message', async () => {
    const inputMessage = '/feedback';
    const expectedMessage =
      'Type in your feedback after a /feedback command\\.\n\n' +
      'e\\.g\\. _/feedback Bot icon is ugly_';

    await callBot(inputMessage);
    assertInputSaved(addInputToDBSpy, inputMessage);
    assertBotResponse(sendMessageSpy, expectedMessage);
  });

  it('["/feedback great bot"] successfully adds a feedback entry', async () => {
    const inputMessage = '/feedback great bot';
    const expectedMessage = 'Got it, thanks for your feedback\\!';

    await callBot(inputMessage);
    assertInputSaved(addInputToDBSpy, inputMessage);
    assertBotResponse(sendMessageSpy, expectedMessage);

    expect(addFeedbackToDBSpy).toHaveBeenCalledWith({
      feedbackId: `1-${new Date('2021-01-05').getTime()}`,
      userId: 1,
      username: 'ashketchum',
      text: 'great bot',
      createdAt: '2021-01-05T00:00:00Z',
    });
  });

  it('[error] returns an error message when addFeedbackToDB returns an error', async () => {
    addFeedbackToDBSpy = jest
      .spyOn(Feedback, 'addFeedbackToDB')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));

    const inputMessage = '/feedback great bot';
    const expectedMessage =
      "Woops, couldn't save your feedback for some unexpected reason\\. Try again?";

    await callBot(inputMessage);
    assertInputSaved(addInputToDBSpy, inputMessage);
    assertBotResponse(sendMessageSpy, expectedMessage);
  });
});

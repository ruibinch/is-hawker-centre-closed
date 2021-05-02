/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import { addFeedback } from '..';
import { mockTelegramUser } from '../../../models/__mocks__/db';

// TODO: shift this to a __mocks__ folder
jest.mock('../../../models/Feedback', () => ({
  addFeedbackToDB: () => Promise.resolve(),
}));

describe('features > feedback > logic', () => {
  const mockDate = '2021-01-05';
  let dateSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO(mockDate).valueOf());
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  describe('addFeedback', () => {
    it('successfully adds a feedback entry', async () => {
      await addFeedback({
        text: 'great bot',
        telegramUser: mockTelegramUser,
      }).then((addFeedbackResponse) => {
        expect(addFeedbackResponse).toBeDefined();

        if (addFeedbackResponse) {
          const { success } = addFeedbackResponse;

          expect(success).toBeTruthy();
        }
      });
    });
  });
});

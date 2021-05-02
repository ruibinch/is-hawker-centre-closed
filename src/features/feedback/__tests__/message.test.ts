import { makeErrorAddingFeedbackMessage, makeFeedbackAddedMessage } from '..';

describe('features > feedback > message', () => {
  describe('makeFeedbackAddedMessage', () => {
    it('returns the correct success message', () => {
      const message = makeFeedbackAddedMessage();

      expect(message).toEqual('Got it, thanks for your feedback\\!');
    });
  });

  describe('makeErrorAddingFeedbackMessage', () => {
    it('returns the correct error message', () => {
      const message = makeErrorAddingFeedbackMessage();

      expect(message).toEqual(
        "Woops, couldn't handle saving your feedback for some unexpected reason. Try again?",
      );
    });
  });
});

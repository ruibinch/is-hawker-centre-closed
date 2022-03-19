import { Result } from '../../../src/lib/Result';
import * as FeedbackFile from '../../../src/models/Feedback';
import { handler as feedbackHandler } from '../../../src/server/handlers/feedback';
import { mockFeedbacks } from './__mocks__/db';
import { callServerHandler } from './helpers';

describe('[server] [integration] /feedback endpoint', () => {
  let getAllFeedbackSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllFeedbackSpy = jest
      .spyOn(FeedbackFile, 'getAllFeedback')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockFeedbacks)));
  });

  afterEach(() => {
    getAllFeedbackSpy.mockRestore();
  });

  it('returns the full list of feedback when no filter is specified', async () => {
    const response = await callServerHandler(feedbackHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(2);
    expect(responseBody.count).toStrictEqual(2);
  });

  it('returns the feedback within a time range when fromDate and toDate is specified', async () => {
    const response = await callServerHandler(feedbackHandler, {
      fromDate: '2021-09-10',
      toDate: '2021-09-10',
    });

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(1);
    expect(responseBody.count).toStrictEqual(1);
    expect(responseBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feedbackId: '5-1631204758' }),
      ]),
    );
  });

  it('returns 400 when getAllFeedback throws an error', async () => {
    getAllFeedbackSpy = jest
      .spyOn(FeedbackFile, 'getAllFeedback')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(feedbackHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining feedback');
  });

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(feedbackHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });
});

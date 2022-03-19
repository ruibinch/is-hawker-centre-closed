import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import {
  Feedback,
  getAllFeedback,
  sortFeedbackByTime,
} from '../../models/Feedback';
import { filterItemsByDate } from '../filters';
import {
  paginateResults,
  validateServerRequest,
  wrapErrorMessage,
} from '../helpers';
import { BaseQueryParams } from '../types';

dotenv.config();

type GetFeedbackParams = BaseQueryParams & {
  fromDate?: string;
  toDate?: string;
};

type GetFeedbackResponse = {
  total: number;
  count: number;
  data: Feedback[];
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getFeedbackResult = await handleGetFeedback(event.body);

  return getFeedbackResult.isOk
    ? makeLambdaResponse(200, getFeedbackResult.value)
    : makeLambdaResponse(400, wrapErrorMessage(getFeedbackResult.value));
};

async function handleGetFeedback(
  requestBody: string | null,
): Promise<ResultType<GetFeedbackResponse, string>> {
  if (!requestBody) {
    return Result.Err('Missing request body');
  }

  const getAllFeedbackResponse = await getAllFeedback();
  if (getAllFeedbackResponse.isErr) {
    return Result.Err('Error obtaining feedback');
  }

  const params = JSON.parse(requestBody) as GetFeedbackParams;
  const feedbacksAll = getAllFeedbackResponse.value;

  const feedbacks = feedbacksAll.filter((feedback) =>
    filterItemsByDate(feedback, params.fromDate, params.toDate),
  );

  const feedbacksSorted = sortFeedbackByTime(feedbacks, 'desc');
  const feedbacksSortedPaginated = paginateResults(feedbacksSorted, params);

  return Result.Ok({
    total: feedbacksSorted.length,
    count: feedbacksSortedPaginated.length,
    data: feedbacksSortedPaginated,
  });
}

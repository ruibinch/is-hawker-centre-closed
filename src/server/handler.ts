import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { isAfter, isBefore, parseISO } from 'date-fns';
import dotenv from 'dotenv';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { getAllInputs, Input } from '../models/Input';
import { getDateIgnoringTime } from '../utils/date';
import type { ServerApiResponse } from '../utils/types';
import { sortInputsByMostRecent } from './helpers';
import type { SearchInputsParams } from './types';

dotenv.config();

export const searchInputs: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  if (!event.body) {
    return callbackWrapper(400, 'Missing request body');
  }

  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return callbackWrapper(400, 'Error obtaining inputs');
  }

  const params = JSON.parse(event.body) as SearchInputsParams;
  const inputsAll = getAllInputsResponse.value;

  const inputs = inputsAll.filter((input) => {
    if (params.userId !== undefined && input.userId !== params.userId) {
      return false;
    }

    const inputCreatedDate = parseISO(getDateIgnoringTime(input.createdAt));

    if (params.fromDate) {
      const fromDate = parseISO(params.fromDate);
      if (isBefore(inputCreatedDate, fromDate)) {
        return false;
      }
    }
    if (params.toDate) {
      const toDate = parseISO(params.toDate);
      if (isAfter(inputCreatedDate, toDate)) {
        return false;
      }
    }

    return true;
  });

  const responseBody: ServerApiResponse<Input[]> = {
    count: inputs.length,
    data: sortInputsByMostRecent(inputs),
  };

  return callbackWrapper(200, JSON.stringify(responseBody));
};

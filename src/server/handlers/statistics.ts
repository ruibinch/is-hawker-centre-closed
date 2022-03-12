import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  isBefore,
  parseISO,
} from 'date-fns';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { getAllInputs, sortInputsByTime } from '../../models/Input';
import { currentDate, toDateISO8601 } from '../../utils/date';
import { validateServerRequest, wrapErrorMessage } from '../helpers';

dotenv.config();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getAllInputsResponse = await getAllInputs();
  if (getAllInputsResponse.isErr) {
    return makeLambdaResponse(400, wrapErrorMessage('Error obtaining inputs'));
  }

  const inputs = getAllInputsResponse.value;
  const inputsSortedAsc = sortInputsByTime(inputs, 'asc');

  const firstInputDate = parseISO(inputsSortedAsc[0].createdAt);
  const today = currentDate();
  const weeksList = eachWeekOfInterval(
    {
      start: firstInputDate,
      end: today,
    },
    {
      weekStartsOn: 1, // week starts on Monday
    },
  );
  const monthsList = eachMonthOfInterval({
    start: firstInputDate,
    end: today,
  });

  const weekCountList = Array(weeksList.length).fill(0);
  const monthCountList = Array(monthsList.length).fill(0);
  let currentWeekIndex = 0;
  let currentMonthIndex = 0;

  inputsSortedAsc.forEach((input) => {
    const inputCreatedDate = parseISO(input.createdAt);

    const startOfNextWeek = weeksList[currentWeekIndex + 1];
    if (isBefore(inputCreatedDate, startOfNextWeek)) {
      weekCountList[currentWeekIndex] += 1;
    } else {
      currentWeekIndex += 1;
      weekCountList[currentWeekIndex + 1] += 1;
    }

    const startOfNextMonth = monthsList[currentMonthIndex + 1];
    if (isBefore(inputCreatedDate, startOfNextMonth)) {
      monthCountList[currentMonthIndex] += 1;
    } else {
      currentMonthIndex += 1;
      monthCountList[currentMonthIndex] += 1;
    }
  });

  const weekToInputCountDict = makeInputCountDict(weeksList, weekCountList);
  const monthToInputCountDict = makeInputCountDict(monthsList, monthCountList);

  const responseBody = {
    data: {
      byWeek: weekToInputCountDict,
      byMonth: monthToInputCountDict,
    },
  };

  return makeLambdaResponse(200, responseBody);
};

function makeInputCountDict(datesList: Date[], countList: number[]) {
  return datesList.reduce(
    (inputCountDict: Record<string, number>, date, idx) => {
      const dateFormatted = toDateISO8601(date);
      inputCountDict[dateFormatted] = countList[idx];
      return inputCountDict;
    },
    {},
  );
}

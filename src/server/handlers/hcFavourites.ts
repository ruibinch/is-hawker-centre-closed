import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { Result, ResultType } from '../../lib/Result';
import { getAllHawkerCentres, HawkerCentre } from '../../models/HawkerCentre';
import { getAllUsers } from '../../models/User';
import { validateServerRequest, wrapErrorMessage } from '../helpers';

dotenv.config();

type GetHcFavouritesCountResponse = {
  data: Array<HawkerCentre & { count: number }>;
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getHcFavouritesCountResult = await handleGetHcFavouritesCount();

  return getHcFavouritesCountResult.isOk
    ? makeLambdaResponse(200, getHcFavouritesCountResult.value)
    : makeLambdaResponse(
        400,
        wrapErrorMessage(getHcFavouritesCountResult.value),
      );
};

async function handleGetHcFavouritesCount(): Promise<
  ResultType<GetHcFavouritesCountResponse, string>
> {
  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.isErr) {
    return Result.Err('Error obtaining users');
  }

  const getAllHawkerCentresResponse = await getAllHawkerCentres();
  if (getAllHawkerCentresResponse.isErr) {
    return Result.Err('Error obtaining hawker centres');
  }

  const users = getAllUsersResponse.value;
  const hawkerCentreIdToCountMap = users.reduce(
    (countMap: Record<string, number>, user) => {
      user.favourites.forEach(({ hawkerCentreId }) => {
        countMap[hawkerCentreId] = (countMap[hawkerCentreId] ?? 0) + 1;
      });
      return countMap;
    },
    {},
  );

  const hawkerCentres = getAllHawkerCentresResponse.value;
  const hawkerCentresWithFavouritesCount = hawkerCentres.map(
    (hawkerCentre) => ({
      ...hawkerCentre,
      count: hawkerCentreIdToCountMap[hawkerCentre.hawkerCentreId] ?? 0,
    }),
  );

  return Result.Ok({
    data: hawkerCentresWithFavouritesCount,
  });
}

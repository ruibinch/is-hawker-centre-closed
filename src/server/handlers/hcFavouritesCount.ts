import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { getAllHawkerCentres } from '../../models/HawkerCentre';
import { getAllUsers } from '../../models/User';
import { validateServerRequest } from '../helpers';

dotenv.config();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!validateServerRequest(event.headers)) {
    return makeLambdaResponse(403);
  }

  const getAllUsersResponse = await getAllUsers();
  if (getAllUsersResponse.isErr) {
    return makeLambdaResponse(400, 'Error obtaining users');
  }

  const getAllHawkerCentresResponse = await getAllHawkerCentres();
  if (getAllHawkerCentresResponse.isErr) {
    return makeLambdaResponse(400, 'Error obtaining hawker centres');
  }

  const users = getAllUsersResponse.value;
  const hawkerCentreIdToCountMap = users.reduce(
    (map: Record<string, number>, user) => {
      user.favourites.forEach(({ hawkerCentreId }) => {
        if (hawkerCentreId in map) {
          map[hawkerCentreId] = map[hawkerCentreId] + 1;
        } else {
          map[hawkerCentreId] = 1;
        }
      });

      return map;
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

  const responseBody = {
    data: hawkerCentresWithFavouritesCount,
  };

  return makeLambdaResponse(200, responseBody);
};

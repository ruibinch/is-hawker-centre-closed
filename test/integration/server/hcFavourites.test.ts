import { Result } from '../../../src/lib/Result';
import * as HawkerCentreFile from '../../../src/models/HawkerCentre';
import * as UserFile from '../../../src/models/User';
import { handler as hcFavouritesHandler } from '../../../src/server/handlers/hcFavourites';
import { mockHawkerCentres, mockUsers } from './__mocks__/db';
import { callServerHandler } from './helpers';

describe('[server] [integration] /hcFavourites endpoint', () => {
  let getAllUsersSpy: jest.SpyInstance;
  let getAllHawkerCentresSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockUsers)));
    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockHawkerCentres)));
  });

  afterEach(() => {
    getAllUsersSpy.mockRestore();
    getAllHawkerCentresSpy.mockRestore();
  });

  it('returns the hawker centres favourites data correctly', async () => {
    const response = await callServerHandler(hcFavouritesHandler);

    const responseBody = JSON.parse(response.body);
    expect(responseBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hawkerCentreId: 1, count: 1 }),
        expect.objectContaining({ hawkerCentreId: 5, count: 1 }),
        expect.objectContaining({ hawkerCentreId: 6, count: 3 }),
        expect.objectContaining({ hawkerCentreId: 37, count: 1 }),
      ]),
    );
  });

  it('returns 400 when getAllUsers throws an error', async () => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(hcFavouritesHandler);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining users');
  });

  it('returns 400 when getAllHawkerCentres throws an error', async () => {
    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(hcFavouritesHandler);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining hawker centres');
  });
});

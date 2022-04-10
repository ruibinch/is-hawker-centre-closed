import { Result } from '../../../src/lib/Result';
import * as HawkerCentreFile from '../../../src/models/HawkerCentre';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import { handler as statisticsHandler } from '../../../src/server/handlers/statistics';
import { mockHawkerCentres, mockInputs, mockUsers } from './__mocks__/db';
import {
  inputsByDayStats,
  inputsStats,
  percentageUsersWithFavsStats,
  usersStats,
  usersWithFavsStats,
} from './__mocks__/statsResults';
import { callServerHandler } from './helpers';

describe('[server] [integration] /statistics endpoint', () => {
  let getAllInputsSpy: jest.SpyInstance;
  let getAllUsersSpy: jest.SpyInstance;
  let getAllHawkerCentresSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllInputsSpy = jest
      .spyOn(InputFile, 'getAllInputs')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockInputs)));
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockUsers)));
    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockHawkerCentres)));
  });

  afterEach(() => {
    getAllInputsSpy.mockRestore();
    getAllUsersSpy.mockRestore();
    getAllHawkerCentresSpy.mockRestore();
  });

  describe('inputs scope', () => {
    const params = {
      scopes: ['inputs'],
      timeframes: ['byMonth', 'byWeek'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.inputs).toStrictEqual(inputsStats);
    });

    it('returns 400 when getAllInputs throws an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining inputs');
    });
  });

  describe('inputsByDay scope', () => {
    const params = {
      scopes: ['inputsByDay'],
      timeframes: ['byMonth'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.inputsByDay).toStrictEqual(inputsByDayStats);
    });

    it('returns 400 when getAllInputs throws an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining inputs');
    });
  });

  describe('users scope', () => {
    const params = {
      scopes: ['users'],
      timeframes: ['byMonth', 'byWeek'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.users).toStrictEqual(usersStats);
    });

    it('returns 400 when getAllInputs throws an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining inputs');
    });
  });

  describe('usersWithFavs scope', () => {
    const params = {
      scopes: ['usersWithFavs'],
      timeframes: ['byMonth', 'byWeek'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.usersWithFavs).toStrictEqual(usersWithFavsStats);
    });

    it('returns 400 when getAllUsers throws an error', async () => {
      getAllUsersSpy = jest
        .spyOn(UserFile, 'getAllUsers')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining users');
    });
  });

  describe('calculatePercentageUsersWithFavsStats scope', () => {
    const params = {
      scopes: ['percentageUsersWithFavs'],
      timeframes: ['byMonth', 'byWeek'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.percentageUsersWithFavs).toStrictEqual(
        percentageUsersWithFavsStats,
      );
    });

    it('returns 400 when getAllInputs throws an error', async () => {
      getAllInputsSpy = jest
        .spyOn(InputFile, 'getAllInputs')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining inputs');
    });

    it('returns 400 when getAllUsers throws an error', async () => {
      getAllUsersSpy = jest
        .spyOn(UserFile, 'getAllUsers')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining users');
    });
  });

  describe('hawkerCentreFavsCount scope', () => {
    const params = {
      scopes: ['hawkerCentreFavsCount'],
      timeframes: ['byMonth'],
    };

    it('returns the correct stats', async () => {
      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.hawkerCentreFavsCount).toEqual(
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

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual('Error obtaining users');
    });

    it('returns 400 when getAllHawkerCentres throws an error', async () => {
      getAllUsersSpy = jest
        .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
        .mockImplementation(() => Promise.resolve(Result.Err()));

      const response = await callServerHandler(statisticsHandler, params);

      const responseBody = JSON.parse(response.body);
      expect(response.statusCode).toStrictEqual(400);
      expect(responseBody.error).toStrictEqual(
        'Error obtaining hawker centres',
      );
    });
  });

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(statisticsHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });

  it('returns 400 when fromDate is of an invalid type', async () => {
    const response = await callServerHandler(statisticsHandler, {
      fromDate: 1001,
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Invalid type of fromDate');
  });

  it('returns 400 when toDate is of an invalid type', async () => {
    const response = await callServerHandler(statisticsHandler, {
      toDate: 1001,
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Invalid type of toDate');
  });

  it('returns 400 when scopes is of an invalid type', async () => {
    const response = await callServerHandler(statisticsHandler, {
      scopes: true,
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Invalid type of scopes');
  });

  it('returns 400 when timeframes is of an invalid type', async () => {
    const response = await callServerHandler(statisticsHandler, {
      timeframes: true,
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Invalid type of timeframes');
  });

  it('returns 400 when there are no scopes specified', async () => {
    const response = await callServerHandler(statisticsHandler, {
      timeframes: ['byMonth'],
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('No scopes specified');
  });

  it('returns 400 when there are no timeframes specified', async () => {
    const response = await callServerHandler(statisticsHandler, {
      scopes: ['inputs'],
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('No timeframes specified');
  });
});

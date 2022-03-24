import { Result } from '../../../src/lib/Result';
import * as InputFile from '../../../src/models/Input';
import { handler as statisticsHandler } from '../../../src/server/handlers/statistics';
import { mockInputs } from './__mocks__/db';
import { inputsByNewUsersStats, inputsStats } from './__mocks__/statsResults';
import { callServerHandler } from './helpers';

describe('[server] [integration] /statistics endpoint', () => {
  let getAllInputsSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllInputsSpy = jest
      .spyOn(InputFile, 'getAllInputs')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockInputs)));
  });

  afterEach(() => {
    getAllInputsSpy.mockRestore();
  });

  it('returns the full list of statistics when no filter is specified', async () => {
    const response = await callServerHandler(statisticsHandler, {
      scopes: {
        inputs: true,
        inputsByNewUsers: true,
      },
      timeframes: {
        byMonth: true,
        byWeek: true,
      },
    });

    const responseBody = JSON.parse(response.body);
    expect(responseBody.data.inputs).toStrictEqual(inputsStats);
    expect(responseBody.data.inputsByNewUsers).toStrictEqual(
      inputsByNewUsersStats,
    );
  });

  it('returns 400 when getAllInputs throws an error', async () => {
    getAllInputsSpy = jest
      .spyOn(InputFile, 'getAllInputs')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(statisticsHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining inputs');
  });

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(statisticsHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });
});

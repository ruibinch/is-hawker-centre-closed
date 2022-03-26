import { Result } from '../../../src/lib/Result';
import * as InputFile from '../../../src/models/Input';
import { handler as statisticsHandler } from '../../../src/server/handlers/statistics';
import { mockInputs } from './__mocks__/db';
import { inputsStats } from './__mocks__/statsResults';
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

  describe('inputs scope', () => {
    const params = {
      scopes: {
        inputs: true,
      },
      timeframes: {
        byMonth: true,
        byWeek: true,
      },
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

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(statisticsHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });

  it('returns 400 when there are no timeframes specified', async () => {
    const response = await callServerHandler(statisticsHandler, {
      scopes: {
        inputs: true,
      },
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('No timeframes specified');
  });

  it('returns 400 when there are no scopes specified', async () => {
    const response = await callServerHandler(statisticsHandler, {
      timeframes: {
        byMonth: true,
      },
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('No scopes specified');
  });

  it('returns 400 when there are no scopes specified with true', async () => {
    const response = await callServerHandler(statisticsHandler, {
      scopes: {
        inputs: false,
      },
      timeframes: {
        byMonth: true,
      },
    });

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('No scopes specified');
  });
});

import { Result } from '../../../src/lib/Result';
import * as InputFile from '../../../src/models/Input';
import { handler as inputsHandler } from '../../../src/server/handlers/inputs';
import { mockInputs } from './__mocks__/db';
import { callServerHandler } from './helpers';

describe('[server] [integration] /inputs endpoint', () => {
  let getAllInputsSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllInputsSpy = jest
      .spyOn(InputFile, 'getAllInputs')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockInputs)));
  });

  afterEach(() => {
    getAllInputsSpy.mockRestore();
  });

  it('returns the full list of inputs when no filter is specified', async () => {
    const response = await callServerHandler(inputsHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(42);
    expect(responseBody.count).toStrictEqual(42);
  });

  it('returns the inputs by a single user when a userId is specified', async () => {
    const response = await callServerHandler(inputsHandler, {
      userId: 1,
    });

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(6);
    expect(responseBody.count).toStrictEqual(6);
  });

  it('returns the inputs within a time range when fromDate and toDate is specified', async () => {
    const response = await callServerHandler(inputsHandler, {
      fromDate: '2021-12-10',
      toDate: '2021-12-28',
    });

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(2);
    expect(responseBody.count).toStrictEqual(2);
    expect(responseBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ inputId: '4-1639123769' }),
        expect.objectContaining({ inputId: '1-1640699008' }),
      ]),
    );
  });

  it('returns 400 when getAllInputs throws an error', async () => {
    getAllInputsSpy = jest
      .spyOn(InputFile, 'getAllInputs')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(inputsHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining inputs');
  });

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(inputsHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });
});

import { Result } from '../../../src/lib/Result';
import * as UserFile from '../../../src/models/User';
import { handler as usersHandler } from '../../../src/server/handlers/users';
import { mockUsers } from './__mocks__/db';
import { callServerHandler } from './helpers';

describe('[server] [integration] /users endpoint', () => {
  let getAllUsersSpy: jest.SpyInstance;

  beforeEach(() => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockUsers)));
  });

  afterEach(() => {
    getAllUsersSpy.mockRestore();
  });

  it('returns the full list of users when no userId filter is specified', async () => {
    const response = await callServerHandler(usersHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(5);
    expect(responseBody.count).toStrictEqual(5);
  });

  it('returns a single user when a userId is specified', async () => {
    const response = await callServerHandler(usersHandler, {
      userId: 1,
    });

    const responseBody = JSON.parse(response.body);
    expect(responseBody.total).toStrictEqual(1);
    expect(responseBody.count).toStrictEqual(1);
    expect(responseBody.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 1 })]),
    );
  });

  it('returns 400 when getAllUsers throws an error', async () => {
    getAllUsersSpy = jest
      .spyOn(UserFile, 'getAllUsers')
      .mockImplementation(() => Promise.resolve(Result.Err()));

    const response = await callServerHandler(usersHandler, {});

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Error obtaining users');
  });

  it('returns 400 when there is no request body', async () => {
    const response = await callServerHandler(usersHandler, undefined);

    const responseBody = JSON.parse(response.body);
    expect(response.statusCode).toStrictEqual(400);
    expect(responseBody.error).toStrictEqual('Missing request body');
  });
});

import { validateToken } from '../auth';

jest.mock('../variables', () => ({
  BOT_TOKEN: 'pokemongottacatchthemall',
}));

describe('bot > auth', () => {
  it('returns true when the input token matches the bot token', () => {
    const queryStringParams = {
      token: 'pokemongottacatchthemall',
    };
    expect(validateToken(queryStringParams)).toBeTruthy();
  });

  it('returns false when the input token does not match the box token', () => {
    const queryStringParams = {
      token: 'teamrocket',
    };
    expect(validateToken(queryStringParams)).toBeFalsy();
  });

  it('returns false when the token is missing', () => {
    const queryStringParams = {};
    expect(validateToken(queryStringParams)).toBeFalsy();
  });
});

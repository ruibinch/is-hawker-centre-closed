import { sanitiseInputText } from '../../src/bot/utils';

describe('bot > utils', () => {
  describe('sanitiseInputText', () => {
    it.each([
      ['/start', '/start'],
      ['/help', '/help'],
      ['bedok', 'bedok'],
      ["people's park", "people's park"],
      ['(ang mo kio)', '(ang mo kio)'],
      ['clementi!@#$%^&*', 'clementi'],
      ['telok blangah{}[]<>,.?\\|:;"-_+=', 'telok blangah'],
    ])('%s -> %s', (input, expected) => {
      const result = sanitiseInputText(input);
      expect(result).toEqual(expected);
    });
  });
});

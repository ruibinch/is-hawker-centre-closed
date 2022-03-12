import { sanitiseInputText } from '../../../src/bot/inputHelpers';

describe('[unit] bot > utils', () => {
  describe('sanitiseInputText', () => {
    it.each([
      ['/start', '/start'],
      ['/help', '/help'],
      ['bedok', 'bedok'],
      ["people's park", "people's park"],
      ['(ang mo kio)', 'ang mo kio'],
      ['upper cross st (hong lim)', 'upper cross st'],
      ['clementi!@#$%^&*', 'clementi'],
      ['telok blangah{}[]<>,.?\\|:;"-+=', 'telok blangah'],
    ])('%s -> %s', (input, expected) => {
      const result = sanitiseInputText(input);
      expect(result).toEqual(expected);
    });
  });
});

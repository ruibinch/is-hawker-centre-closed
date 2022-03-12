import {
  extractFromFiles,
  findMissing,
  type KeyExtractedFromFile,
} from 'i18n-extract';

import { dictionary } from '../../../src/bot/lang';

describe('[unit] lang keys', () => {
  let keys: KeyExtractedFromFile[];

  beforeAll(() => {
    keys = extractFromFiles(['./src/**/*.ts'], {
      marker: 't',
      parser: 'typescript',
    });
  });

  function testLanguage(language: string, dict: Record<string, string>) {
    describe(`[${language}]`, () => {
      it('should not have any unused keys', () => {
        const unusedKeys = findMissing(dict, keys);

        if (unusedKeys.length !== 0) {
          const message =
            `ERROR: [${language}] ${unusedKeys.length} unused key(s) found\n\n` +
            `${unusedKeys.map(({ key }) => key).join('\n')}`;
          console.warn(message);
        }
        expect(unusedKeys).toHaveLength(0);
      });

      it('should not have any missing keys', () => {
        const missingKeys = findMissing(dict, keys);

        if (missingKeys.length !== 0) {
          const message =
            `ERROR: [${language}] ${missingKeys.length} missing key(s) found\n\n` +
            `${missingKeys.map(({ key }) => key).join('\n')}`;
          console.warn(message);
        }
        expect(missingKeys).toHaveLength(0);
      });
    });
  }

  Object.entries(dictionary).forEach(([language, dictForLanguage]) => {
    testLanguage(language, dictForLanguage);
  });
});

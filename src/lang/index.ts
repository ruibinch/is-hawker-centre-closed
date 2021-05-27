import i18n, { TranslateOptions } from 'i18n-js';

import enDict from './en.json';

// FIXME: figure out how to best utilise this type in Dictionary
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Language = 'en';

type Dictionary = {
  [lang: string]: Record<string, string>;
};

const normaliseKey = (key: string) => key.replace(/\./g, '-');
const normaliseDictionary = (dictionary: Dictionary) =>
  Object.entries(dictionary).reduce(
    (newDict: Dictionary, [lang, translations]) => {
      newDict[lang] = Object.entries(translations).reduce(
        (newTranslations: Record<string, string>, [key, value]) => {
          newTranslations[normaliseKey(key)] = value;
          return newTranslations;
        },
        {},
      );
      return newDict;
    },
    {},
  );

const dictionary: Dictionary = {
  en: enDict,
};

export const initDictionary = (): void => {
  i18n.locale = 'en';
  i18n.translations = normaliseDictionary(dictionary);
};

export const t = (key: string, params?: TranslateOptions): string => {
  const text = i18n.t(normaliseKey(key), params);
  return text;
};

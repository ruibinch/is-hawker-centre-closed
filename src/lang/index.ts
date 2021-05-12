import i18n, { TranslateOptions } from 'i18n-js';

import enDict from './en.json';

type Dictionary = {
  [lang: string]: Record<string, string>;
};

enum Language {
  en = 'en',
}

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
  [Language.en]: enDict,
};

export const initDictionary = (): void => {
  i18n.locale = 'en';
  i18n.translations = normaliseDictionary(dictionary);
};

export const t = (key: string, params?: TranslateOptions): string => {
  const text = i18n.t(normaliseKey(key), params);
  return text;
};

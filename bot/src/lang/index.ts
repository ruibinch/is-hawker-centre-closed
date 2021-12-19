import i18n, { TranslateOptions } from 'i18n-js';

import enDict from './en.json';
import zhDict from './zh.json';

export type Language = 'en' | 'zh';

type Dictionary = {
  [lang in Language]: Record<string, string>;
};

const normaliseKey = (key: string) => key.replace(/\./g, '-');
const normaliseDictionary = (dictionary: Dictionary) =>
  Object.entries(dictionary).reduce(
    (newDict: Dictionary, [lang, translations]) => {
      // @ts-expect-error lang can only be "en"/"zh"
      newDict[lang] = Object.entries(translations).reduce(
        (newTranslations: Record<string, string>, [key, value]) => {
          newTranslations[normaliseKey(key)] = value;
          return newTranslations;
        },
        {},
      );
      return newDict;
    },
    {
      en: {},
      zh: {},
    },
  );

export const dictionary: Dictionary = {
  en: enDict,
  zh: zhDict,
};

export const initDictionary = (languageCode: Language): void => {
  i18n.locale = languageCode;
  i18n.translations = normaliseDictionary(dictionary);
};

export const t = (key: string, params?: TranslateOptions): string => {
  const text = i18n.t(normaliseKey(key), params);
  return text;
};

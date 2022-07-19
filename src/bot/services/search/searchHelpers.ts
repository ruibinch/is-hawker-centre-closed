const ACRONYMS: Record<string, string> = {
  amk: 'ang mo kio',
  bt: 'bukit',
  clem: 'clementi',
  ecp: 'east coast park',
  hg: 'hougang',
  je: 'jurong east',
  jln: 'jalan',
  las: 'lorong ah soo',
  lor: 'lorong',
  mkt: 'market',
  nth: 'north',
  oth: 'our tampines hub',
  rd: 'road',
  srgn: 'serangoon',
  st: 'street',
  sth: 'south',
  tamp: 'tampines',
  tpy: 'toa payoh',
  upp: 'upper',
};

export function expandAcronyms(word: string) {
  return ACRONYMS[word.toLowerCase()] ?? word;
}

// These are general hawker centre keywords that do not help in narrowing the search so they can be omitted
// prettier-ignore
const IGNORE_GENERAL_KEYWORDS = [
  'food','fare','hawker','center','centre','opening','hours','and'
]

export function isRelevantKeyword(word: string) {
  return !IGNORE_GENERAL_KEYWORDS.includes(word);
}

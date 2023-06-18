const ACRONYMS: Record<string, string> = {
  amk: 'ang mo kio',
  blk: 'block',
  bt: 'bukit',
  clem: 'clementi',
  ctr: 'centre',
  ecp: 'east coast park',
  hg: 'hougang',
  je: 'jurong east',
  jln: 'jalan',
  las: 'lorong ah soo',
  lor: 'lorong',
  mkt: 'market',
  markets: 'market',
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

const SPELLCHECK: Record<string, string> = {
  'kebun bahru': 'kebun baru',
  raja: 'rajah',
};

export function expandAcronymsAndSpellcheck(word: string) {
  const wordLowercase = word.toLowerCase();
  return ACRONYMS[wordLowercase] ?? SPELLCHECK[wordLowercase] ?? word;
}

// These are general hawker centre keywords that do not help in narrowing the search so they can be omitted
// prettier-ignore
const IGNORE_GENERAL_KEYWORDS = [
  'food','fare','hawker','center','centre','complex','opening','hours','block','road','jalan','and','the'
]

export function isRelevantKeyword(word: string) {
  return !IGNORE_GENERAL_KEYWORDS.includes(word.toLowerCase());
}

import fs from 'fs';

import { isCommandInModule } from '../bot/commands';
import { isCallbackQuery } from '../bot/services/helpers';
import { processSearch } from '../bot/services/search';
import { initAWSConfig } from '../ext/aws/config';
import { Closure, getAllClosures } from '../models/Closure';
import { getAllInputs, Input } from '../models/Input';

const closuresFileVersion = process.env['VERSION'] ?? undefined;
const useDDB = process.env['USE_DDB'] ?? false;

if (useDDB) {
  initAWSConfig();
}

function notNil<T>(value: T | null | undefined): value is T {
  return !(value === null || value === undefined);
}

async function getClosures() {
  let closures: Closure[];

  if (useDDB) {
    const getAllClosuresResponse = await getAllClosures();
    if (getAllClosuresResponse.isErr) {
      throw getAllClosuresResponse.value;
    }
    closures = getAllClosuresResponse.value;
  } else {
    if (!closuresFileVersion) {
      throw new Error('Missing VERSION value for closures file');
    }

    const closuresFile = fs.readFileSync(
      `./data/closures-${closuresFileVersion}.json`,
      { encoding: 'utf8' },
    );
    closures = JSON.parse(closuresFile);
  }

  return closures;
}

async function getInputsForSearch() {
  let inputs: Input[];

  if (useDDB) {
    const getAllInputsResult = await getAllInputs();
    if (getAllInputsResult.isErr) {
      throw getAllInputsResult.value;
    }
    inputs = getAllInputsResult.value;
  } else {
    const inputsFile = fs.readFileSync(`./data/inputs-prod.json`, {
      encoding: 'utf8',
    });
    inputs = JSON.parse(inputsFile) as Input[];
  }

  return (
    inputs
      // ignore own account
      .filter(({ userId }) => userId !== 60238293)
      .filter(
        ({ text: inputText }) =>
          !isCommandInModule(inputText) && !isCallbackQuery(inputText),
      )
  );
}

function getIgnoreTerms() {
  const ignoreFile = fs.readFileSync(
    `./src/scripts/analyseSearchResponses.ignore`,
    { encoding: 'utf8' },
  );
  return ignoreFile
    .split('\n')
    .filter((term) => term !== '' && !term.startsWith('//'));
}

async function analyseSearchResponses(
  inputsForSearch: Input[],
  closures: Closure[],
) {
  const searchResponses = await Promise.all(
    inputsForSearch.map(async (input) => {
      const searchResult = await processSearch(input.text, closures);
      return searchResult.isOk ? searchResult.value : undefined;
    }),
  );

  const ignoreTerms = getIgnoreTerms();

  const emptySearchResponses = searchResponses
    .filter(notNil)
    .filter((searchResponse) => !searchResponse.hasResults)
    .map((searchResponse) => searchResponse.params)
    .filter(
      ({ keyword, modifier }) =>
        !ignoreTerms.includes(`${keyword}::${modifier}`),
    );

  const emptySearchResponsesDict = emptySearchResponses.reduce(
    (dict: Record<string, number>, { keyword, modifier }) => {
      const key = `${keyword}::${modifier}`;
      if (dict[key]) {
        dict[key] += 1;
      } else {
        dict[key] = 1;
      }
      return dict;
    },
    {},
  );

  const emptySearchResponsesDictSorted = Object.entries(
    emptySearchResponsesDict,
  )
    // only consider empty responses with multiple entries
    .filter(([, value]) => value > 1)
    .sort((a, b) => b[1] - a[1])
    .reduce((dict: Record<string, number>, [key, count]) => {
      dict[key] = count;
      return dict;
    }, {});

  return emptySearchResponsesDictSorted;
}

async function run() {
  const inputsForSearch = await getInputsForSearch();
  const closures = await getClosures();

  const emptyResponses = await analyseSearchResponses(
    inputsForSearch,
    closures,
  );

  console.log({
    totalCount: Object.entries(emptyResponses).length,
    data: emptyResponses,
  });
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

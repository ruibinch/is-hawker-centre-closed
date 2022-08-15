import fs from 'fs';
import path from 'path';

import { isCommandInModule } from '../bot/commands';
import { isCallbackQuery } from '../bot/services/helpers';
import { processSearch } from '../bot/services/search';
import { initAWSConfig } from '../ext/aws/config';
import { Closure, getAllClosures } from '../models/Closure';
import { getInputsFromTimestamp, Input } from '../models/Input';

const [minEmptyResponsesFromArgs] = process.argv.slice(2);
const closuresFileVersion = process.env['VERSION'] ?? undefined;

function notNil<T>(value: T | null | undefined): value is T {
  return !(value === null || value === undefined);
}

async function getClosures({ useDDB }: { useDDB: boolean }) {
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
      path.resolve(
        __dirname,
        `../../data/closures-${closuresFileVersion}.json`,
      ),
      { encoding: 'utf8' },
    );
    closures = JSON.parse(closuresFile);
  }

  return closures;
}

async function getInputsForSearch({
  useDDB,
  startTimestamp,
}: {
  useDDB: boolean;
  startTimestamp: number | undefined;
}) {
  let inputs: Input[];

  if (useDDB) {
    if (startTimestamp === undefined) {
      throw new Error('Missing startTimestamp value');
    }

    const getInputsResult = await getInputsFromTimestamp(
      Number(startTimestamp),
    );
    if (getInputsResult.isErr) {
      throw getInputsResult.value;
    }
    inputs = getInputsResult.value;
  } else {
    const inputsFile = fs.readFileSync(
      path.resolve(__dirname, '../../data/inputs-prod.json'),
      { encoding: 'utf8' },
    );
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
  try {
    const ignoreFile = fs.readFileSync(
      path.resolve(__dirname, `analyseSearchResponses.ignore`),
      { encoding: 'utf8' },
    );
    return ignoreFile
      .split('\n')
      .filter((term) => term !== '' && !term.startsWith('//'));
  } catch (err) {
    console.error('[analyseSearchResponses > getIgnoreTerms]', err);
    return [];
  }
}

async function analyseSearchResponses({
  inputsForSearch,
  closures,
  minEmptyResponses,
}: {
  inputsForSearch: Input[];
  closures: Closure[];
  minEmptyResponses: number;
}) {
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
    .filter(([, value]) => value >= minEmptyResponses)
    .sort((a, b) => b[1] - a[1])
    .reduce((dict: Record<string, number>, [key, count]) => {
      dict[key] = count;
      return dict;
    }, {});

  return emptySearchResponsesDictSorted;
}

export async function run(props: {
  minEmptyResponses: number;
  useDDB: boolean;
  startTimestamp: number | undefined;
}) {
  const { minEmptyResponses, useDDB, startTimestamp } = props;
  if (useDDB) {
    initAWSConfig();
  }

  const inputsForSearch = await getInputsForSearch({ useDDB, startTimestamp });
  const closures = await getClosures({ useDDB });

  const emptyResponses = await analyseSearchResponses({
    inputsForSearch,
    closures,
    minEmptyResponses,
  });

  console.log({
    count: Object.entries(emptyResponses).length,
    data: emptyResponses,
  });
  return emptyResponses;
}

if (require.main === module) {
  run({
    minEmptyResponses: minEmptyResponsesFromArgs
      ? Number(minEmptyResponsesFromArgs)
      : 1,
    useDDB: Boolean(process.env['USE_DDB']),
    startTimestamp: process.env['START_TIMESTAMP']
      ? Number(process.env['START_TIMESTAMP'])
      : undefined,
  }).then(() => {
    process.exit(0);
  });
}

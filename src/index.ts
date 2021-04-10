import fs from 'fs';
import pdf from 'pdf-parse';
import { addData } from './aws';
import { renderPage } from './parser';
import { Result } from './types';
import { isBlank } from './utils';

const dataBuffer = fs.readFileSync('./data/apr-2021.pdf');

pdf(dataBuffer, {
  pagerender: renderPage,
}).then((data) => {
  const outputs = data.text.split('\n');

  let result: Result[] = [];
  outputs.forEach((output) => {
    if (isBlank(output)) return;

    const outputJson = JSON.parse(output);
    result = [...result, ...outputJson];
  });

  console.log(result);
  console.log(`${result.length} entries found`);

  addData(result);
});

import fs from 'fs';
import pdf from 'pdf-parse';
import { uploadData } from '../common/dynamodb';
import { renderPage } from './parser';
import { Result } from './types';
import { isBlank } from './utils';

const args = process.argv.slice(2);
const [fileName, isUploadToAws] = args;
if (!fileName) {
  throw new Error('Filename missing');
}

const dataBuffer = fs.readFileSync(`./data/${fileName}.pdf`);

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
  // console.log(result);
  console.log(`[${fileName}.pdf] ${result.length} entries found`);

  if (isUploadToAws === 'true') {
    console.log(`[${fileName}.pdf] Uploading to AWS`);
    uploadData(result);
  }
});

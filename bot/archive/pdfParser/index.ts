// @ts-nocheck
import fs from 'fs';
import pdf from 'pdf-parse';

// import { uploadClosures } from '../../common/dynamodb';
import { renderPage } from './parser';
import { Closure } from './types';
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

  let closures: Closure[] = [];
  outputs.forEach((output) => {
    if (isBlank(output)) return;

    const outputJson = JSON.parse(output);
    closures = [...closures, ...outputJson];
  });

  if (isUploadToAws === 'true') {
    console.log(`[${fileName}.pdf] ${closures.length} entries found`);
    console.log(`[${fileName}.pdf] Uploading to AWS`);
    // uploadClosures(closures);
  } else {
    console.log(
      closures
        .map(
          (closure) =>
            `${closure.hawkerCentre} (${closure.startDate} to ${closure.endDate})`,
        )
        .join('\n\n'),
    );
    console.log(`[${fileName}.pdf] ${closures.length} entries found`);
  }
});

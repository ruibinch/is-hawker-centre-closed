import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const telegramBotTokenDev = process.env['TELEGRAM_BOT_TOKEN_DEV'];
const telegramBotTokenProd = process.env['TELEGRAM_BOT_TOKEN_PROD'];
const apiGatewayDev = process.env.APIG_DEV;
const apiGatewayProd = process.env.APIG_PROD;
const awsRegion = process.env.REGION;

if (telegramBotTokenDev === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN_DEV missing');
}
if (telegramBotTokenProd === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN_PROD missing');
}
if (apiGatewayDev === undefined) {
  throw new Error('APIG_DEV missing');
}
if (apiGatewayProd === undefined) {
  throw new Error('APIG_PROD missing');
}
if (awsRegion === undefined) {
  throw new Error('REGION missing');
}

const apiParams: [string, string, string, string][] = [
  [apiGatewayDev, awsRegion, 'dev', telegramBotTokenDev],
  [apiGatewayProd, awsRegion, 'prod', telegramBotTokenProd],
];

console.log('Testing APIs of dev and prod environments\n');

Promise.all(
  apiParams
    .map((params) => {
      const [apiGatewayId, region, slsStage, token] = params;
      return axios.post(
        `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/${slsStage}/bot?token=${token}`,
      );
    })
    .map((p) => p.catch((e) => e)),
).then((responses) => {
  responses.forEach((response) => {
    console.log(`URL: ${response.config.url}`);
    console.log(`Status code: ${response.response.status}\n`);
  });
});

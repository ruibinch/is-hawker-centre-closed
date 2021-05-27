import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const botTokenDev = process.env.BOT_TOKEN_dev;
const botTokenProd = process.env.BOT_TOKEN_prod;
const apiGatewayDev = process.env.APIG_DEV;
const apiGatewayProd = process.env.APIG_PROD;
const awsRegion = process.env.REGION;

if (botTokenDev === undefined) {
  throw new Error('BOT_TOKEN_dev missing');
}
if (botTokenProd === undefined) {
  throw new Error('BOT_TOKEN_prod missing');
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
  [apiGatewayDev, awsRegion, 'dev', botTokenDev],
  [apiGatewayProd, awsRegion, 'prod', botTokenProd],
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

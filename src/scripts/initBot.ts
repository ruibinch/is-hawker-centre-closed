import axios from 'axios';
import dotenv from 'dotenv';

import { makeTelegramApiBase, WebhookInfoResponse } from '../utils/telegram';

dotenv.config();

const [apiGatewayId, region, slsStage] = (() =>
  process.env.NODE_ENV === 'production'
    ? [process.env.APIG_PROD, process.env.REGION, 'prod']
    : [process.env.APIG_DEV, process.env.REGION, 'dev'])();
const token = process.env[`BOT_TOKEN_${slsStage}`];

if (apiGatewayId === undefined) {
  throw new Error('APIG missing');
}
if (region === undefined) {
  throw new Error('REGION missing');
}
if (token === undefined) {
  throw new Error('BOT_TOKEN missing');
}

axios
  .get(`${makeTelegramApiBase(token)}/setWebhook`, {
    params: {
      url: `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/${slsStage}/bot?token=${token}`,
    },
  })
  .then(() => {
    axios
      .get(`${makeTelegramApiBase(token)}/getWebhookInfo`)
      .then((response) => {
        const webhookInfoResponse = response.data as WebhookInfoResponse;
        console.log(`Webhook URL: ${webhookInfoResponse.result.url}`);
      });
  });

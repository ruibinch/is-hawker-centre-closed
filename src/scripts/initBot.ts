import axios from 'axios';
import dotenv from 'dotenv';

import { makeTelegramApiBase, WebhookInfoResponse } from '../utils/telegram';
import { Stage } from '../utils/types';

dotenv.config();

const token = process.env.BOT_TOKEN;
const [apiGatewayId, region, slsStage] = (() =>
  process.env.NODE_ENV === 'production'
    ? [process.env.API_GATEWAY_ID_PROD, process.env.REGION, Stage.prod]
    : [process.env.API_GATEWAY_ID_DEV, process.env.REGION, Stage.dev])();

if (token === undefined) {
  throw new Error('BOT_TOKEN missing');
}
if (apiGatewayId === undefined) {
  throw new Error('API_GATEWAY_ID missing');
}
if (region === undefined) {
  throw new Error('REGION missing');
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

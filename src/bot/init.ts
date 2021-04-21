import axios from 'axios';
import dotenv from 'dotenv';

import { makeTelegramApiBase, WebhookInfoResponse } from '../common/telegram';

dotenv.config();

const token = process.env.BOT_TOKEN;
const apiGatewayId = process.env.API_GATEWAY_ID;

if (token === undefined) {
  throw new Error('BOT_TOKEN missing');
}
if (apiGatewayId === undefined) {
  throw new Error('API_GATEWAY_ID missing');
}

axios
  .get(`${makeTelegramApiBase(token)}/setWebhook`, {
    params: {
      url: `https://${apiGatewayId}.execute-api.ap-southeast-1.amazonaws.com/dev/bot?token=${token}`,
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

import axios from 'axios';
import dotenv from 'dotenv';

import { makeTelegramApiBase, WebhookInfoResponse } from '../bot/telegram';

dotenv.config();

const region = process.env.REGION;
const [slsStage, apiGatewayId, telegramBotToken] = (() =>
  process.env.NODE_ENV === 'production'
    ? ['prod', process.env.APIG_PROD, process.env['TELEGRAM_BOT_TOKEN_PROD']]
    : ['dev', process.env.APIG_DEV, process.env['TELEGRAM_BOT_TOKEN_DEV']])();

if (region === undefined) {
  throw new Error('REGION missing');
}
if (apiGatewayId === undefined) {
  throw new Error('APIG missing');
}
if (telegramBotToken === undefined) {
  throw new Error(`TELEGRAM_BOT_TOKEN missing`);
}

axios
  .get(`${makeTelegramApiBase(telegramBotToken)}/setWebhook`, {
    params: {
      url: `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/${slsStage}/bot?token=${telegramBotToken}`,
    },
  })
  .then(() => {
    axios
      .get(`${makeTelegramApiBase(telegramBotToken)}/getWebhookInfo`)
      .then((response) => {
        const webhookInfoResponse = response.data as WebhookInfoResponse;
        console.log(`Webhook URL: ${webhookInfoResponse.result.url}`);
      });
  });

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN ?? '';
const apiGatewayId = process.env.API_GATEWAY_ID;
const bot = new TelegramBot(token);

bot
  .setWebHook(
    `https://${apiGatewayId}.execute-api.ap-southeast-1.amazonaws.com/dev/bot`,
  )
  .then(() => {
    bot.getWebHookInfo().then((response) => {
      console.log(`Webhook URL: ${response.url}`);
    });
  });

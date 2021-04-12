import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import { SearchResponse } from '../reader/types';
import { makeMessage } from './message';
require('dotenv').config();

const token = process.env.BOT_TOKEN ?? '';
const apiGatewayId = process.env.API_GATEWAY_ID;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  const { text } = msg;
  if (!text || text.trim().length === 0) {
    bot.sendMessage(chatId, 'Specify some keywords\\!');
    return;
  }

  axios
    .get(`https://${apiGatewayId}.execute-api.ap-southeast-1.amazonaws.com/dev/search`, {
      params: {
        term: text,
      },
    })
    .then((response) => {
      const searchResponse = response.data as SearchResponse;
      const reply = makeMessage(searchResponse);

      bot.sendMessage(chatId, reply, {
        parse_mode: 'MarkdownV2',
      });
    });
});

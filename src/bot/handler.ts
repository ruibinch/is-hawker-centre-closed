import axios from 'axios';
import { APIGatewayProxyHandler } from 'aws-lambda';
import TelegramBot from 'node-telegram-bot-api';
import { makeCallbackWrapper, makeResponseBody } from '../reader/utils';
import { makeMessage } from './message';
import { BOT_TOKEN } from './variables';
import { processSearch } from '../reader/search';

export const bot: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
) => {
  if (!event.body) {
    return makeResponseBody(400);
  }
  const callbackWrapper = makeCallbackWrapper(callback);

  const reqBody = JSON.parse(event.body);
  const inputMessage = reqBody.message as TelegramBot.Message;
  const {
    chat: { id: chatId },
    text,
  } = inputMessage;

  if (!text || text.trim().length === 0) {
    sendMessage(chatId, 'Specify some keywords\\!');
    return makeResponseBody(204);
  }

  await processSearch(text)
    .then((searchResponse) => {
      if (searchResponse === null) {
        callbackWrapper(400);
      } else {
        const replyMessage = makeMessage(searchResponse);
        sendMessage(chatId, replyMessage);
        callbackWrapper(204);
      }
    })
    .catch((error) => {
      console.log(error);
      callbackWrapper(400);
    });

  return makeResponseBody(204);
};

function sendMessage(chatId: number, message: string) {
  axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    params: {
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2',
    },
  });
}

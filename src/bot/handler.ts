import axios from 'axios';
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import TelegramBot from 'node-telegram-bot-api';
import { makeCallbackWrapper } from '../common/lambda';
import { processSearch } from '../reader/search';
import { makeMessage } from './message';
import { BOT_TOKEN } from './variables';

export const bot: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);

  if (!event.body) {
    return callbackWrapper(400);
  }

  const reqBody = JSON.parse(event.body);
  const inputMessage = reqBody.message as TelegramBot.Message;
  const {
    chat: { id: chatId },
    text,
  } = inputMessage;

  if (!text || text.trim().length === 0) {
    sendMessage(chatId, 'Specify some keywords\\!');
    return callbackWrapper(204);
  }

  await processSearch(text)
    .then((searchResponse) => {
      if (searchResponse === null) {
        return callbackWrapper(400);
      }

      const replyMessage = makeMessage(searchResponse);
      sendMessage(chatId, replyMessage);
      return callbackWrapper(204);
    })
    .catch((error) => {
      console.log(error);
      return callbackWrapper(400);
    });

  return callbackWrapper(502);
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

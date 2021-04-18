import axios from 'axios';
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { makeCallbackWrapper } from '../common/lambda';
import { makeTelegramApiBase, Message } from '../common/telegram';
import { processSearch } from '../reader/search';
import { makeMessage } from './message';
import { BOT_TOKEN } from './variables';
import { isCommand, makeCommandMessage } from './commands';
import { sanitiseInputText } from './utils';
import { validateToken } from './auth';

export const bot: APIGatewayProxyHandler = async (
  event,
  _context,
  callback,
): Promise<APIGatewayProxyResult> => {
  const callbackWrapper = makeCallbackWrapper(callback);
  if (!validateToken(event.queryStringParameters)) {
    return callbackWrapper(403);
  }

  if (!event.body) {
    return callbackWrapper(400);
  }

  const reqBody = JSON.parse(event.body);
  const inputMessage = reqBody.message as Message;
  const {
    chat: { id: chatId },
    text,
  } = inputMessage;

  const textSanitised = sanitiseInputText(text);

  if (!textSanitised || textSanitised.trim().length === 0) {
    sendMessage(chatId, 'Specify some keywords\\!');
    return callbackWrapper(204);
  }

  if (isCommand(textSanitised)) {
    const commandMessage = makeCommandMessage(textSanitised);
    sendMessage(chatId, commandMessage);
    return callbackWrapper(204);
  }

  await processSearch(textSanitised)
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
  axios.get(`${makeTelegramApiBase(BOT_TOKEN)}/sendMessage`, {
    params: {
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2',
    },
  });
}

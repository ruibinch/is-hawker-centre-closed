import Discord from 'discord.js';
import dotenv from 'dotenv';

import { notEmpty } from '../../utils';

dotenv.config();
const client = new Discord.Client();
// These are not defined using stage params as they are run via standalone scripts as well
const adminDevChannelId = process.env.DISCORD_ADMIN_DEV_CHANNEL_ID ?? '';
const adminProdChannelId = process.env.DISCORD_ADMIN_PROD_CHANNEL_ID ?? '';
const adminFeedbackChannelId = process.env.DISCORD_FEEDBACK_CHANNEL_ID ?? '';

const DISCORD_BOT_LOGIN_TIMEOUT_MS = 60000;
const DISCORD_MESSAGE_MAX_LENGTH = 2000;

export async function sendDiscordAdminMessage(
  messageRaw: string | (string | null)[],
): Promise<void> {
  await executeBotLogin();

  const message = Array.isArray(messageRaw)
    ? messageRaw.filter(notEmpty).join('\n')
    : messageRaw;
  const channel = await client.channels.fetch(getAdminChannelId(message));
  if (!(channel instanceof Discord.TextChannel)) return;

  const discordMessages =
    message.length > DISCORD_MESSAGE_MAX_LENGTH
      ? (() => {
          const numMessageSegments = Math.ceil(
            message.length / DISCORD_MESSAGE_MAX_LENGTH,
          );
          return Array(numMessageSegments)
            .fill('')
            .map((_, idx) =>
              message.slice(
                idx * DISCORD_MESSAGE_MAX_LENGTH,
                (idx + 1) * DISCORD_MESSAGE_MAX_LENGTH,
              ),
            );
        })()
      : [message];

  // Execute promises sequentially
  await discordMessages.reduce(
    (promise, discordMessage) =>
      promise.then((_responses) =>
        channel
          .send(discordMessage)
          .then((res) => res)
          .catch((err) => {
            console.error('[discord > sendDiscordAdminMessage]', err);
            return null;
          })
          .then((_response) => [..._responses, _response]),
      ),
    Promise.resolve([] as Array<Discord.Message | null>),
  );
}

export async function sendDiscordFeedbackMessage(
  messageRaw: string | string[],
) {
  await executeBotLogin();

  const message = Array.isArray(messageRaw)
    ? messageRaw.join('\n')
    : messageRaw;
  const channel = await client.channels.fetch(adminFeedbackChannelId);
  if (!(channel instanceof Discord.TextChannel)) return;

  await channel.send(message).catch((err) => {
    console.error('[discord > sendDiscordFeedbackMessage]', err);
    return null;
  });
}

// Add timeout of 60s to bot login to prevent indefinite retries when Discord API is down
async function executeBotLogin() {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new Error(
            `Discord bot login timed out after ${
              DISCORD_BOT_LOGIN_TIMEOUT_MS / 1000
            } seconds`,
          ),
        ),
      DISCORD_BOT_LOGIN_TIMEOUT_MS,
    );
  });

  const result = await Promise.race([
    client.login(process.env.DISCORD_BOT_TOKEN),
    timeoutPromise,
  ])
    .then((res) => {
      clearTimeout(timeoutHandle);
      return res;
    })
    .catch((error) => {
      return error;
    });

  if (result instanceof Error) {
    throw result;
  }
}

function getAdminChannelId(message: string) {
  return message.includes('[prod]') ? adminProdChannelId : adminDevChannelId;
}

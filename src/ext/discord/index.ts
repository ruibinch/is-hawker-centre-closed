import Discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const client = new Discord.Client();
// These are not defined using stage params as they are run via standalone scripts as well
const adminDevChannelId = process.env.DISCORD_ADMIN_DEV_CHANNEL_ID ?? '';
const adminProdChannelId = process.env.DISCORD_ADMIN_PROD_CHANNEL_ID ?? '';
const closuresAdminDevChannelId =
  process.env.DISCORD_CLOSURES_ADMIN_DEV_CHANNEL_ID ?? '';
const closuresAdminProdChannelId =
  process.env.DISCORD_CLOSURES_ADMIN_PROD_CHANNEL_ID ?? '';

const DISCORD_BOT_LOGIN_TIMEOUT_MS = 60000;

export async function sendDiscordAdminMessage(message: string): Promise<void> {
  await executeBotLogin();

  const channel = await client.channels.fetch(getAdminChannelId(message));
  if (channel instanceof Discord.TextChannel) {
    await channel.send(message);
  }
}

export async function sendDiscordClosuresAdminMessage(
  message: string,
): Promise<void> {
  await executeBotLogin();

  const channel = await client.channels.fetch(
    getClosuresAdminChannelId(message),
  );
  if (channel instanceof Discord.TextChannel) {
    await channel.send(message);
  }
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

function getClosuresAdminChannelId(message: string) {
  return message.includes('[prod]')
    ? closuresAdminProdChannelId
    : closuresAdminDevChannelId;
}

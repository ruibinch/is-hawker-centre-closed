import Discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const client = new Discord.Client();
const adminDevChannelId = process.env.DISCORD_ADMIN_DEV_CHANNEL_ID ?? '';
const adminProdChannelId = process.env.DISCORD_ADMIN_PROD_CHANNEL_ID ?? '';
const closuresAdminChannelId =
  process.env.DISCORD_CLOSURES_ADMIN_CHANNEL_ID ?? '';

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

  const channel = await client.channels.fetch(closuresAdminChannelId);
  if (channel instanceof Discord.TextChannel) {
    await channel.send(message);
  }
}

async function executeBotLogin() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
}

function getAdminChannelId(message: string) {
  return message.startsWith('[prod]') ? adminProdChannelId : adminDevChannelId;
}

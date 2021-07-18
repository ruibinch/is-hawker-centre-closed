import Discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const client = new Discord.Client();
const adminChannelId = process.env.DISCORD_ADMIN_CHANNEL_ID ?? '';
const closuresAdminChannelId =
  process.env.DISCORD_CLOSURES_ADMIN_CHANNEL_ID ?? '';

export async function sendDiscordMessage(message: string): Promise<void> {
  await executeBotLogin();

  const channel = await client.channels.fetch(adminChannelId);
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

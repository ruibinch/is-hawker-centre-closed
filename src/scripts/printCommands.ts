import { COMMANDS } from '../bot/commands';

// Print list of commands with associated descriptions for feeding into Telegram BotFather.
console.log(
  COMMANDS.map(
    (cmd) => `${cmd.endpoint.replace('/', '')} - ${cmd.description}`,
  ).join('\n'),
);

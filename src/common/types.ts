export enum Stage {
  dev = 'dev',
  prod = 'prod',
}

export function getStage(): Stage {
  return process.env.NODE_ENV === 'production' ? Stage.prod : Stage.dev;
}

export enum Module {
  search = 'search',
  favourites = 'favourites',
  feedback = 'feedback',
  general = 'general',
}

export type BotResponse = {
  message: string;
  choices?: string[];
};

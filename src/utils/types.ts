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

/**
 * Response types
 */

export type BotResponse = {
  message: string;
  choices?: string[];
};

export type ServiceResponse = Promise<BotResponse | null>;

// TODO: consider extending from this to allow `output` to be accurately typed
export type DBResponse = {
  success: boolean;
  output?: unknown;
};

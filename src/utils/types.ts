export type Stage = 'dev' | 'prod';

export function getStage(): Stage {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

export type Module = 'search' | 'favourites' | 'feedback' | 'general';

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

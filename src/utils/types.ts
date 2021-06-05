import { Result } from 'ts-results';

import { AWSError } from '../errors/AWSError';

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

export type ServiceResponse = Result<BotResponse, AWSError | void>;

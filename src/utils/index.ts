import { Stage } from './types';

export * from './types';

export function getStage(): Stage {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

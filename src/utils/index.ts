import { Stage } from './types';

export * from './types';

export async function sleep(durationInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMs));
}

export function prettifyJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 4);
}

export function getStage(): Stage {
  const stageFromEnv = process.env.STAGE;
  if (stageFromEnv !== undefined) {
    if (!isStage(stageFromEnv)) {
      throw new Error(`Invalid STAGE value: ${stageFromEnv}`);
    }
    return stageFromEnv;
  }

  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

function isStage(s: string): s is Stage {
  return s === 'dev' || s === 'prod';
}

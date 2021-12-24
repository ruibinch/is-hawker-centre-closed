import type { Stage } from './types';

export * from './types';

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

export async function sleep(durationInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMs));
}

export function prettifyJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 4);
}

export function wrapUnknownError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  if (typeof err === 'string') {
    return new Error(err);
  }
  if (typeof err === 'object' && err !== null) {
    return new Error(err.toString());
  }
  return new Error();
}

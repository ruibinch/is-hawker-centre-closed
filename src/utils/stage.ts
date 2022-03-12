export type Stage = 'dev' | 'prod';

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

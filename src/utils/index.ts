export * from './types';

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

import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { run as executeSyncDb } from '../../scripts/syncDb';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (): Promise<APIGatewayProxyResult> => {
    try {
      await executeSyncDb();
      return makeLambdaResponse(204);
    } catch (error) {
      console.error('[syncDbTrigger]', error);
      Sentry.captureException(error);

      return makeLambdaResponse(400);
    }
  },
);

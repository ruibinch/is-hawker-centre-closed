import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { run as executeCheckHealthiness } from '../../scripts/checkHealthiness';
import { run as executeSyncDb } from '../../scripts/syncDb';
import { getStage } from '../../utils/stage';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
  environment: getStage(),
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (): Promise<APIGatewayProxyResult> => {
    try {
      await executeCheckHealthiness();
      return makeLambdaResponse(204);
    } catch (error) {
      console.error('[checkHealthinessTrigger]', error);
      Sentry.captureException(error);

      // re-run sync again when health check fails
      await executeSyncDb();

      return makeLambdaResponse(400);
    }
  },
);

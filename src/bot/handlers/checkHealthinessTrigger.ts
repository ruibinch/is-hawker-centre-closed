import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { run as executeCheckHealthiness } from '../../scripts/checkHealthiness';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (): Promise<APIGatewayProxyResult> => {
    try {
      await executeCheckHealthiness();
      return makeLambdaResponse(204);
    } catch (error) {
      console.error('[checkHealthinessTrigger]', error);
      Sentry.captureException(error);

      return makeLambdaResponse(400);
    }
  },
);

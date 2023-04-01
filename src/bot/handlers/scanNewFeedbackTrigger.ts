import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { run as executeScanNewFeedback } from '../../scripts/scanNewFeedback';
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
      await executeScanNewFeedback(1);
      return makeLambdaResponse(204);
    } catch (error) {
      console.error('[scanNewFeedbackTrigger]', error);
      Sentry.captureException(error);

      return makeLambdaResponse(400);
    }
  },
);

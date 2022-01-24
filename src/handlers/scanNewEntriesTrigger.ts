import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dotenv from 'dotenv';

import { makeCallbackWrapper } from '../ext/aws/lambda';
import { run as executeScanNewEntries } from '../scripts/scanNewEntries';

dotenv.config();

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // sends 100% of errors to Sentry
});

export const handler = Sentry.AWSLambda.wrapHandler(
  async (
    _event: APIGatewayProxyEvent,
    _context,
    callback,
  ): Promise<APIGatewayProxyResult> => {
    const callbackWrapper = makeCallbackWrapper(callback);

    try {
      await executeScanNewEntries();
      return callbackWrapper(204);
    } catch (error) {
      console.error('[scanNewEntriesTrigger]', error);
      Sentry.captureException(error);

      return callbackWrapper(400);
    }
  },
);

import * as Sentry from '@sentry/serverless';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { startOfDay, subWeeks } from 'date-fns';
import dotenv from 'dotenv';

import { makeLambdaResponse } from '../../ext/aws/lambda';
import { sendDiscordAdminMessage } from '../../ext/discord';
import { run as executeAnalyseSearchResponses } from '../../scripts/analyseSearchResponses';
import { currentDate } from '../../utils/date';
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
      await run();
      return makeLambdaResponse(204);
    } catch (error) {
      Sentry.captureException(error);
      return makeLambdaResponse(400);
    }
  },
);

async function run() {
  const today = startOfDay(currentDate());
  const oneWeekAgoFromToday = subWeeks(today, 1);

  const emptyResponses = await executeAnalyseSearchResponses({
    minEmptyResponses: 1,
    useDDB: true,
    startTimestamp: oneWeekAgoFromToday.getTime(),
  });
  await sendDiscordAdminMessage([
    `**[${getStage()}]  🕵️‍♀️ SEARCH RESPONSES ANALYSIS**`,
    JSON.stringify(
      {
        count: Object.entries(emptyResponses).length,
        data: emptyResponses,
      },
      null,
      4,
    ),
  ]);
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

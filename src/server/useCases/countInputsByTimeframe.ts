import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';

import { sendDiscordAnalysisMessage } from '../../ext/discord';
import { getInputsFromTimestamp } from '../../models/Input';
import { getDateIgnoringTime } from '../../utils/date';
import { getLineChartUrl } from '../chartHelper';

interface Timeframe {
  count: number;
  period: 'day' | 'week' | 'month';
}

process.env.TZ = 'UTC';

export async function countInputsByTimeframe({ count, period }: Timeframe) {
  const getStartDate = (() => {
    if (period === 'month') return subMonths;
    if (period === 'week') return subWeeks;
    return subDays;
  })();
  const getTimePeriods = (() => {
    if (period === 'month') return eachMonthOfInterval;
    if (period === 'week') return eachWeekOfInterval;
    return eachDayOfInterval;
  })();

  const today = new Date();
  const timePeriodsByTimestamp = getTimePeriods({
    start: getStartDate(today, count),
    end: today,
  }).map((date) => date.getTime());

  const getInputsResponse = await getInputsFromTimestamp(
    timePeriodsByTimestamp[0],
  );
  if (getInputsResponse.isErr) {
    console.error(getInputsResponse.value);
    throw new Error('Error fetching inputs');
  }
  const allInputs = getInputsResponse.value;

  const inputsCountForTimePeriod = new Array<number>(
    timePeriodsByTimestamp.length,
  ).fill(0);
  let currIdx = 0;

  // inputs are sorted in ascending order of timestamp
  allInputs.forEach((input) => {
    if (input.createdAtTimestamp > timePeriodsByTimestamp[currIdx + 1]) {
      // increment index if index now belongs in the next time period
      currIdx += 1;
    }
    inputsCountForTimePeriod[currIdx] += 1;
  });

  const chartUrl = getLineChartUrl({
    labels: timePeriodsByTimestamp.map(getDateIgnoringTime),
    data: inputsCountForTimePeriod,
    title: `Inputs count over the last ${count} ${period}s`,
    isDarkMode: true,
  });

  await sendDiscordAnalysisMessage(chartUrl);
}

(async () => {
  const [count, period] = process.argv.slice(2);
  if (count === undefined || period === undefined) {
    throw new Error('Missing params');
  }

  // @ts-expect-error ignore typechecks
  await countInputsByTimeframe({ count, period });
})();

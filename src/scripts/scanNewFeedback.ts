import { sendDiscordFeedbackMessage } from '../ext/discord';
import { getAllFeedback } from '../models/Feedback';
import { formatDateWithTime, isRecent } from '../utils/date';

async function scanNewFeedback(withinDays: number | undefined) {
  const getAllFeedbackResponse = await getAllFeedback();
  if (getAllFeedbackResponse.isErr) {
    throw getAllFeedbackResponse.value;
  }

  const newFeedback =
    withinDays === undefined
      ? getAllFeedbackResponse.value
      : getAllFeedbackResponse.value.filter((entry) =>
          isRecent(entry.createdAt, withinDays),
        );
  if (newFeedback.length === 0) {
    return;
  }

  const newFeedbackOutput = [...newFeedback]
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    })
    .map((feedback) => {
      const { text, userId, username, createdAt } = feedback;

      const author = `${username ? `${username}, ` : ''}${userId}`;
      const createdAtFmt = formatDateWithTime(new Date(createdAt));
      return `${text}\n(submitted by ${author} at ${createdAtFmt})`;
    })
    .join('\n\n');

  await sendDiscordFeedbackMessage(newFeedbackOutput);
}

export async function run(withinDays?: number | undefined) {
  await scanNewFeedback(withinDays);
}

if (require.main === module) {
  const [withinDaysArg] = process.argv.slice(2);
  const withinDays = withinDaysArg ? Number(withinDaysArg) : undefined;

  run(withinDays).then(() => {
    process.exit(0);
  });
}

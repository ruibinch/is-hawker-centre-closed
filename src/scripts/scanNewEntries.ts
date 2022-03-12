import { sendDiscordAdminMessage } from '../ext/discord';
import { getAllFeedback } from '../models/Feedback';
import { getAllUsers } from '../models/User';
import { formatDateWithTime, isRecent } from '../utils/date';
import { getStage } from '../utils/stage';

function formatCreatedAtDate(dateString: string) {
  return formatDateWithTime(new Date(dateString));
}

async function scanNewEntries() {
  const getAllUsersResponse = await getAllUsers();
  const getAllFeedbackResponse = await getAllFeedback();
  if (getAllUsersResponse.isErr) {
    throw getAllUsersResponse.value;
  }
  if (getAllFeedbackResponse.isErr) {
    throw getAllFeedbackResponse.value;
  }

  const newUsers = getAllUsersResponse.value.filter((entry) =>
    isRecent(entry.createdAt),
  );
  const newFeedback = getAllFeedbackResponse.value.filter((entry) =>
    isRecent(entry.createdAt),
  );

  const newUsersOutput = newUsers.map((user, idx) => {
    const { userId, username, createdAt } = user;
    return `${idx + 1}. ${username ?? userId} (${formatCreatedAtDate(
      createdAt,
    )})`;
  });
  const newFeedbackOutput = newFeedback.map((feedback, idx) => {
    const { text, userId, username, createdAt } = feedback;

    return `${idx + 1}. ${text}\n  (submitted by ${
      username ? `${username}, ` : ''
    }${userId} at ${formatCreatedAtDate(createdAt)})`;
  });

  await sendDiscordAdminMessage(
    `[${getStage()}] NEW ENTRIES IN THE PAST WEEK\n` +
      `Users:\n${
        newUsersOutput.length === 0 ? 'none' : newUsersOutput.join('\n')
      }\n\n` +
      `Feedback:\n${
        newFeedbackOutput.length === 0 ? 'none' : newFeedbackOutput.join('\n')
      }`,
  );
}

export async function run(): Promise<void> {
  await scanNewEntries();
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

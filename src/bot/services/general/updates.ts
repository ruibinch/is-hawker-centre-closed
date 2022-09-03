import { Result } from '../../../lib/Result';
import { escapeCharacters } from '../../../telegram';

export function getLatestUpdates() {
  const changelogEntries = getChangelogEntries();

  const messageForEntries = changelogEntries.map((changelogEntry) => {
    const { version, date, details } = changelogEntry;
    return (
      `*${escapeCharacters(version)} ${escapeCharacters(date)}*\n` +
      `${details
        .map((detail) => `\u{00B7} ${escapeCharacters(detail)}`)
        .join('\n')}`
    );
  });

  return Result.Ok({ message: messageForEntries.join('\n\n') });
}

type ChangelogEntry = {
  version: string;
  date: string;
  details: string[];
};

function getChangelogEntries(): ChangelogEntry[] {
  return [
    {
      version: '[0.18.0]',
      date: '2022-08-21',
      details: ['Added "/weather" command'],
    },
    {
      version: '[0.17.0]',
      date: '2022-08-14',
      details: ['Added search by "week"/"this week" timeframe'],
    },
    {
      version: '[0.16.0]',
      date: '2022-08-11',
      details: ['Updated data schema and improved bot security'],
    },
    {
      version: '[0.15.0]',
      date: '2022-07-17',
      details: ['Improved search filter logic'],
    },
    {
      version: '[0.14.0]',
      date: '2022-07-04',
      details: [
        'Implemented pagination for search result lists exceeding 10 entries',
      ],
    },
  ];
}

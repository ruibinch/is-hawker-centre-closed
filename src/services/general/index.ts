import { Ok } from 'ts-results';

import { ServiceResponse } from '../../utils';

export async function manageGeneral(): Promise<ServiceResponse> {
  const changelogEntries = getLatestUpdates();

  const messageForEntries = changelogEntries.map((changelogEntry) => {
    const { version, date, details } = changelogEntry;
    return (
      `*${version} ${date}*\n` +
      `${details.map((detail) => `\u{00B7} ${detail}`)}`
    );
  });

  return Ok({ message: messageForEntries.join('\n\n') });
}

type ChangelogEntry = {
  version: string;
  date: string;
  details: string[];
};

function getLatestUpdates(): ChangelogEntry[] {
  return [
    {
      version: '\\[0\\.8\\.0\\]',
      date: '2021\\-07\\-28',
      details: [
        'Added auto\\-expansion of recognised acronyms, e\\.g\\. "amk" to "ang mo kio", "tpy" to "toa payoh"',
      ],
    },
  ];
}

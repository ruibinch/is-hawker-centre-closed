import { Ok } from 'ts-results';

import { ServiceResponse } from '../../utils';

export async function manageGeneral(): Promise<ServiceResponse> {
  const changelogEntries = getLatestUpdates();

  const messageForEntries = changelogEntries.map((changelogEntry) => {
    const { version, date, details } = changelogEntry;
    return (
      `*${version} ${date}*\n` +
      `${details.map((detail) => `\u{00B7} ${detail}`).join('\n')}`
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
      version: '\\[0\\.9\\.1\\]',
      date: '2021\\-09\\-01',
      details: [
        'Fixed incomplete results being returned when searching by "month" or "next month"',
      ],
    },
    {
      version: '\\[0\\.9\\.0\\]',
      date: '2021\\-07\\-28',
      details: ['Added /updates command to check the latest updates'],
    },
    {
      version: '\\[0\\.8\\.0\\]',
      date: '2021\\-07\\-28',
      details: [
        'Added auto\\-expansion of recognised acronyms, e\\.g\\. "amk" to "ang mo kio", "tpy" to "toa payoh"',
      ],
    },
  ];
}

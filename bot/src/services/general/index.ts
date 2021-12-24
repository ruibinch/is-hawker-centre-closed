/* eslint-disable max-len */
import { Result } from '../../../../lib/Result';
import type { ServiceResponse } from '../../utils';

export async function manageGeneral(): Promise<ServiceResponse> {
  const changelogEntries = getLatestUpdates();

  const messageForEntries = changelogEntries.map((changelogEntry) => {
    const { version, date, details } = changelogEntry;
    return (
      `*${version} ${date}*\n` +
      `${details.map((detail) => `\u{00B7} ${detail}`).join('\n')}`
    );
  });

  return Result.Ok({ message: messageForEntries.join('\n\n') });
}

type ChangelogEntry = {
  version: string;
  date: string;
  details: string[];
};

function getLatestUpdates(): ChangelogEntry[] {
  return [
    {
      version: '\\[0\\.13\\.0\\]',
      date: '2021\\-09\\-18',
      details: ['Added search by "next week" timeframe'],
    },
    {
      version: '\\[0\\.12\\.0\\]',
      date: '2021\\-09\\-14',
      details: [
        'Changed returned results to always be sorted in alphabetical order',
      ],
    },
    {
      version: '\\[0\\.11\\.0\\]',
      date: '2021\\-08\\-08',
      details: [
        'Changed default timeframe from "today" to "next" to return more useful information by default',
      ],
    },
    {
      version: '\\[0\\.10\\.0\\]',
      date: '2021\\-08\\-07',
      details: ['Added indefinite end date option'],
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

/* eslint-disable max-len */
import { Result } from '../../../lib/Result';
import type { ServiceResponse } from '../../types';

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
  ];
}

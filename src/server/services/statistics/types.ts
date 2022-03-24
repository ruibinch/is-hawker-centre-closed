export type Scope = 'inputs' | 'inputsByNewUsers' | 'users' | 'newUsers';
export type Timeframe = 'byMonth' | 'byWeek' | 'byDay';

export type StatsEntry = {
  date: string;
  count: number;
};

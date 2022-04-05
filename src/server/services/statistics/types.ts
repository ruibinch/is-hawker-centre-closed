export type Scope =
  | 'inputs'
  | 'inputsByDay'
  | 'users'
  | 'usersWithFavs'
  | 'percentageUsersWithFavs';
export type Timeframe = 'byMonth' | 'byWeek' | 'byDay';

export type StatsEntry = {
  date: string;
  new: number;
  total: number;
};

export type StatsForTimeframe = Partial<Record<Timeframe, StatsEntry[]>>;

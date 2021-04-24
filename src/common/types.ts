export type BotResponse = {
  message: string;
  choices?: string[];
};

export enum ClosureReason {
  cleaning = 'cleaning',
  renovation = 'renovation',
}

export type Result = {
  id: string;
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

export type HawkerCentreInfo = {
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string;
};

export type UserFavourite = {
  hawkerCentreId: number;
  dateAdded: string;
};

export type User = {
  userId: number;
  username?: string;
  languageCode?: string;
  favourites: UserFavourite[];
};

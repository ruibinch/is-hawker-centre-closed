export type Feedback = {
  feedbackId: string;
  userId: number;
  username?: string;
  text: string;
  dateSubmitted: string;
};

export type HawkerCentreInfo = {
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string;
};

export enum ClosureReason {
  cleaning = 'cleaning',
  renovation = 'renovation',
}

export type Result = HawkerCentreInfo & {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

export type ResultPartial = HawkerCentreInfo &
  Partial<{
    id: string;
    reason: ClosureReason;
    startDate: string;
    endDate: string;
  }>;

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

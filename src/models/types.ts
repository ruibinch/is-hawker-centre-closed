export type Feedback = {
  feedbackId: string;
  userId: number;
  username?: string;
  text: string;
};

export type HawkerCentre = {
  hawkerCentreId: number;
  name: string;
  nameSecondary?: string;
};

export type ClosureReason = 'cleaning' | 'renovation';

type HawkerCentreClosure = {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

export type Closure = HawkerCentre & HawkerCentreClosure;

export type ClosurePartial = HawkerCentre & Partial<HawkerCentreClosure>;

export type UserFavourite = {
  hawkerCentreId: number;
  dateAdded: string;
};

export type User = {
  userId: number;
  username?: string;
  languageCode?: string;
  favourites: UserFavourite[];
  isInFavouritesMode: boolean;
  notifications: boolean;
};

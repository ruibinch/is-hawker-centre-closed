export type Feedback = {
  feedbackId: string;
  userId: number;
  username?: string;
  text: string;
};

export type ClosureReason = 'cleaning' | 'others';

type HawkerCentreClosure = {
  id: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

export type Closure = HawkerCentre & HawkerCentreClosure;

export type ClosurePartial = HawkerCentre & Partial<HawkerCentreClosure>;

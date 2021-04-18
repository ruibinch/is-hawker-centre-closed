export enum ClosureReason {
  cleaning = 'cleaning',
  renovation = 'renovation',
}

export type Result = {
  id: string;
  hawkerCentreId: string;
  name: string;
  nameSecondary?: string;
  reason: ClosureReason;
  startDate: string;
  endDate: string;
};

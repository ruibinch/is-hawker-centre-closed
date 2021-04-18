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

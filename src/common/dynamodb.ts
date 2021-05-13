export const getProvisionedThroughput = (): {
  ReadCapacityUnits: number;
  WriteCapacityUnits: number;
} => ({
  ReadCapacityUnits: 2,
  WriteCapacityUnits: 2,
});

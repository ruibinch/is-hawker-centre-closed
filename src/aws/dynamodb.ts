export const getProvisionedThroughput = (): {
  ReadCapacityUnits: number;
  WriteCapacityUnits: number;
} => ({
  ReadCapacityUnits: 5,
  WriteCapacityUnits: 5,
});

export const getDynamoDBBillingDetails = (): Partial<AWS.DynamoDB.CreateTableInput> => ({
  BillingMode: 'PAY_PER_REQUEST',
});

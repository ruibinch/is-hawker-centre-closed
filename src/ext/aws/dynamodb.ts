// pause threads relating to DDB operations in order for any changes to propagate
export const DDB_PROPAGATE_DURATION = 4000;

export const getDynamoDBBillingDetails =
  (): Partial<AWS.DynamoDB.CreateTableInput> => ({
    BillingMode: 'PAY_PER_REQUEST',
  });

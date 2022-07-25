// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.html

// pause threads relating to DDB operations in order for any changes to propagate
export const DDB_PROPAGATE_DURATION = 4000;

export const getDynamoDBBillingDetails = (): Pick<
  AWS.DynamoDB.CreateTableInput,
  'BillingMode'
> => ({
  BillingMode: 'PAY_PER_REQUEST',
});

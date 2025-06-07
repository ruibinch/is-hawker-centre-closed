// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.html
import { CreateTableInput, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { awsConfig } from './config';

const ddbClient = new DynamoDBClient(awsConfig);
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// pause threads relating to DDB operations in order for any changes to propagate
export const DDB_PROPAGATE_DURATION = 4000;

export const getDynamoDBBillingDetails = (): Pick<
  CreateTableInput,
  'BillingMode'
> => ({
  BillingMode: 'PAY_PER_REQUEST',
});

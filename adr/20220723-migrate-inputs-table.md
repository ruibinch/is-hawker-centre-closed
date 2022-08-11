# ADR - Migrate Inputs Table (2022/07/23)

## Summary

## Discussion

The `inputs` table has these columns:

- `inputId`
  - Format `{{userId}}-{{createdAtTimestamp}}`
- `userId`
- `username`
- `text`
- `createdAt`
  - In ISO-8601 format

Only one key is defined in this DynamoDB table - `inputId` is the unique partition key.

This makes data retrieval methods very inflexible, as Query operations can only be performed on this `inputId` value. It is actually virtually impossible to use this value at all as it is partially comprised of the Unix timestamp of the creation date, which will be unknown to any client.

Due to this limitation, only Scan operations are possible, where the entire table is retrieved from DynamoDB and then subsequently filtered in the JS function. This is a problem for 2 main reasons:

1. Scan operations are discouraged in the first place, as any filter should be done on the DB side before data retrieval
1. Scan operations have a maximum cap of 1MB on the size of the returned data, so tables exceeding 1MB of data will require multiple Scan operations, which further adds on to the inefficiency

## Solution

Revamp the `inputs` table to the following structure.

- Columns:
  - `userId`
  - `username`
  - `text`
  - `createdAtTimestamp`
    - In Unix timestamp format
- Keys:
  - Partition key: `userId`
  - Sort key: `createdAtTimestamp`
  - Composite primary key: `userId` + `createdAtTimestamp`

> **DynamoDB reference**: DynamoDB uses the partition key value as input to an internal hash function. The output from the hash function determines the partition (physical storage internal to DynamoDB) in which the item will be stored. All items with the same partition key value are stored together, in sorted order by sort key value.

Then, Query operations can be performed by specifying a `userId` and an optional `createdAtTimestamp`, which allows for significantly greater flexibility in data retrieval.

## Migration plan

The migration will be done in 3 phases:

1. Add a new `createdAtTimestamp` column to the current table and populate with values
1. Update the table configuration to specify the new partition, sort and composite primary keys
1. Once everything is well-tested and confirmed to be working correctly, remove the `inputId` and `createdAt` columns

import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { DBError } from '../errors/DBError';
import { initAWSConfig } from '../ext/aws/config';
import { DDB_PROPAGATE_DURATION } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Result, ResultType } from '../lib/Result';
import { ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { HawkerCentre } from '../models/HawkerCentre';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { sleep, WrappedPromise, wrapPromise } from '../utils';
import { getStage } from '../utils/stage';

const CLI_OPERATION = process.env['CLI_OPERATION'];

initAWSConfig();
const dynamoDb = new AWS.DynamoDB();

type DynamoDBOperationResult = ResultType<string | undefined, string>;

/**
 * Parses DynamoDB operation results into neat ResultType outputs.
 */
function parseDynamoDBPromises(
  outputs: WrappedPromise<
    PromiseResult<
      AWS.DynamoDB.CreateTableOutput | AWS.DynamoDB.DeleteTableOutput,
      AWS.AWSError
    >
  >[],
): DynamoDBOperationResult[] {
  return outputs.map((output) => {
    if ('error' in output) {
      return Result.Err(output.error.message);
    }

    return Result.Ok(output.result.TableDescription?.TableName);
  });
}

function makeListOutput(results: DynamoDBOperationResult[]) {
  if (results.length === 0) return '-';

  return results.map((result, idx) => `${idx + 1}. ${result.value}`).join('\n');
}

async function createTables(
  _tableSchemasToCreate?: AWS.DynamoDB.CreateTableInput[],
) {
  const tableSchemasToCreate = _tableSchemasToCreate ?? [
    ClosureObject.getSchema(),
    HawkerCentre.getSchema(),
    User.getSchema(),
    Feedback.getSchema(),
    Input.getSchema(),
  ];

  const createTableOutputs = await Promise.all(
    tableSchemasToCreate
      .map((tableSchema) => dynamoDb.createTable(tableSchema).promise())
      .map(wrapPromise),
  );
  const createTableOutputsParsed = parseDynamoDBPromises(createTableOutputs);
  const successOutputs = createTableOutputsParsed.filter((res) => res.isOk);
  const failureOutputs = createTableOutputsParsed.filter((res) => res.isErr);

  await sendDiscordAdminMessage([
    `**[${getStage()}]  📢 DB TABLES CREATED**`,
    `${makeListOutput(successOutputs)}`,
    ...(failureOutputs.length > 0
      ? [
          `\nError creating the following tables:`,
          `${makeListOutput(failureOutputs)}`,
        ]
      : []),
  ]);

  if (failureOutputs.length > 0) {
    throw new DBError(makeListOutput(failureOutputs));
  }
}

async function deleteTables(_tablesToDelete?: string[]) {
  const tablesToDelete = _tablesToDelete ?? [
    ClosureObject.getTableName(),
    HawkerCentre.getTableName(),
    User.getTableName(),
    Feedback.getTableName(),
    Input.getTableName(),
  ];

  const deleteTableOutputs = await Promise.all(
    tablesToDelete
      .map((tableName) =>
        dynamoDb.deleteTable({ TableName: tableName }).promise(),
      )
      .map(wrapPromise),
  );
  const deleteTableOutputsParsed = parseDynamoDBPromises(deleteTableOutputs);
  const successOutputs = deleteTableOutputsParsed.filter((res) => res.isOk);
  const failureOutputs = deleteTableOutputsParsed.filter((res) => res.isErr);

  await sendDiscordAdminMessage([
    `**[${getStage()}]  📢 DB TABLES DELETED**`,
    `${makeListOutput(successOutputs)}`,
    ...(failureOutputs.length > 0
      ? [
          `\nError deleting the following tables:`,
          `${makeListOutput(failureOutputs)}`,
        ]
      : []),
  ]);

  if (failureOutputs.length > 0) {
    throw new DBError(makeListOutput(failureOutputs));
  }
}

/**
 * Deletes and recreates the Closures and HawkerCentre tables.
 */
async function resetTables() {
  await sendDiscordAdminMessage(`**[${getStage()}]  📢🔄 RESET IN PROGRESS **`);

  await deleteTables([
    ClosureObject.getTableName(),
    HawkerCentre.getTableName(),
  ]);
  await sleep(DDB_PROPAGATE_DURATION);

  await createTables([ClosureObject.getSchema(), HawkerCentre.getSchema()]);
  await sleep(DDB_PROPAGATE_DURATION);
}

export async function run(operationInput?: string) {
  const operation = operationInput ?? CLI_OPERATION;

  if (operation === 'create') {
    await createTables();
  } else if (operation === 'delete') {
    await deleteTables();
  } else if (operation === 'reset') {
    await resetTables();
  } else {
    throw new Error(
      operation === undefined
        ? 'No operation name specified'
        : `Unrecognised operation name "${operation}"`,
    );
  }
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  });
}

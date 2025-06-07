import {
  CreateTableCommand,
  CreateTableCommandOutput,
  CreateTableInput,
  DeleteTableCommand,
  DeleteTableOutput,
} from '@aws-sdk/client-dynamodb';

import { AWSError } from '../errors/AWSError';
import { DBError } from '../errors/DBError';
import { DDB_PROPAGATE_DURATION, ddbDocClient } from '../ext/aws/dynamodb';
import { sendDiscordAdminMessage } from '../ext/discord';
import { Result, ResultType } from '../lib/Result';
import { ClosureObject } from '../models/Closure';
import { Feedback } from '../models/Feedback';
import { HawkerCentre } from '../models/HawkerCentre';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { sleep } from '../utils';
import { getStage } from '../utils/stage';

const CLI_OPERATION = process.env['CLI_OPERATION'];

type DynamoDBOperationResult = ResultType<string | undefined, string>;

/**
 * Parses DynamoDB operation results into neat ResultType outputs.
 */
function parseDynamoDBOutputs(
  outputs: (CreateTableCommandOutput | DeleteTableOutput | AWSError)[],
): DynamoDBOperationResult[] {
  return outputs.map((output) => {
    if (output instanceof AWSError) {
      return Result.Err(output.message);
    }

    return Result.Ok(output.TableDescription?.TableName);
  });
}

function makeListOutput(results: DynamoDBOperationResult[]) {
  if (results.length === 0) return '-';

  return results.map((result, idx) => `${idx + 1}. ${result.value}`).join('\n');
}

async function createTables(_tableSchemasToCreate?: CreateTableInput[]) {
  const tableSchemasToCreate = _tableSchemasToCreate ?? [
    ClosureObject.getSchema(),
    HawkerCentre.getSchema(),
    User.getSchema(),
    Feedback.getSchema(),
    Input.getSchema(),
  ];

  const createTableOutputs = await Promise.all(
    tableSchemasToCreate.map(async (tableSchema) => {
      const command = new CreateTableCommand(tableSchema);
      return ddbDocClient
        .send(command)
        .catch((err) => new AWSError(err.message ?? 'Unknown error'));
    }),
  );
  const createTableOutputsParsed = parseDynamoDBOutputs(createTableOutputs);
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
    tablesToDelete.map(async (tableName) => {
      const command = new DeleteTableCommand({ TableName: tableName });
      return ddbDocClient
        .send(command)
        .catch((err) => new AWSError(err.message ?? 'Unknown error'));
    }),
  );
  const deleteTableOutputsParsed = parseDynamoDBOutputs(deleteTableOutputs);
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

  try {
    await deleteTables([
      ClosureObject.getTableName(),
      HawkerCentre.getTableName(),
    ]);
    await sleep(DDB_PROPAGATE_DURATION);
  } catch (err) {
    if (
      err instanceof DBError &&
      // consider if having a custom error is better, e.g. DBTableNotFoundError
      err.message.includes('Requested resource not found')
    ) {
      await sendDiscordAdminMessage(
        `⚠️ Unable to find tables, skipping deletion;\n${err.message}`,
      );
    } else {
      // still throw error for other errors in case it's some weird scenario
      throw err;
    }
  }

  // primitive method of 1 retry
  // creation might fail if the deletion has not fully propagated yet
  try {
    await createTables([ClosureObject.getSchema(), HawkerCentre.getSchema()]);
  } catch (err) {
    // if table creation failed the first time, wait again before retrying
    await sleep(DDB_PROPAGATE_DURATION);
    await createTables([ClosureObject.getSchema(), HawkerCentre.getSchema()]);
  }
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

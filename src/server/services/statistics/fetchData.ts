import { Result } from '../../../lib/Result';
import { getAllInputs, sortInputsByTime } from '../../../models/Input';
import { getAllUsers, sortUsersByTime } from '../../../models/User';
import { filterItemsByDate } from '../../filters';
import { Scope } from './types';

/**
 * Helper function to fetch the raw data at the start before performing analytics operations.
 *
 * Returns list of inputs and users (if needed), sorted in ascending order of creation date.
 */
export async function fetchData({
  scopes,
  fromDate,
  toDate,
}: {
  scopes: Partial<Record<Scope, boolean>>;
  fromDate: string | undefined;
  toDate: string | undefined;
}) {
  let inputs;
  let users;

  if (scopes.inputs || scopes.users || scopes.percentageUsersWithFavs) {
    const getAllInputsResult = await getAllInputs();
    if (getAllInputsResult.isErr) {
      return Result.Err('Error obtaining inputs');
    }

    const inputsAll = getAllInputsResult.value;
    const inputsFiltered = inputsAll.filter((input) =>
      filterItemsByDate(input, fromDate, toDate),
    );
    inputs = sortInputsByTime(inputsFiltered, 'asc');
  }

  if (scopes.usersWithFavs) {
    const getAllUsersResult = await getAllUsers();
    if (getAllUsersResult.isErr) {
      return Result.Err('Error obtaining users');
    }

    const usersRaw = getAllUsersResult.value;
    users = sortUsersByTime(usersRaw, 'asc');
  }

  return Result.Ok({ inputs, users });
}

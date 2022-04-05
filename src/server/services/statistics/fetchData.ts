import { Result } from '../../../lib/Result';
import { getAllInputs, sortInputsByTime } from '../../../models/Input';
import { getAllUsers, sortUsersByTime } from '../../../models/User';
import { filterItemsByDate } from '../../filters';
import { includesSome } from './common';
import { Scope } from './types';

type Props = {
  scopes: Scope[];
  fromDate: string | undefined;
  toDate: string | undefined;
};

/**
 * Helper function to fetch the raw data at the start before performing analytics operations.
 *
 * Returns list of inputs and users (if needed), sorted in ascending order of creation date.
 */
export async function fetchData({ scopes, fromDate, toDate }: Props) {
  let inputs;
  let users;

  if (
    includesSome(scopes, [
      'inputs',
      'inputsByDay',
      'users',
      'percentageUsersWithFavs',
    ])
  ) {
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

  if (includesSome(scopes, ['usersWithFavs', 'percentageUsersWithFavs'])) {
    const getAllUsersResult = await getAllUsers();
    if (getAllUsersResult.isErr) {
      return Result.Err('Error obtaining users');
    }

    const usersAll = getAllUsersResult.value;
    const usersFiltered = usersAll.filter((user) =>
      filterItemsByDate(user, fromDate, toDate),
    );
    users = sortUsersByTime(usersFiltered, 'asc');
  }

  return Result.Ok({ inputs, users });
}

import { Result } from '../../../lib/Result';
import { getAllHawkerCentres } from '../../../models/HawkerCentre';
import { getAllInputs, sortInputsByTime } from '../../../models/Input';
import { getAllUsers, sortUsersByTime } from '../../../models/User';
import { filterItemsByDate } from '../../filters';
import { Scope } from './types';

type DataType = 'Input' | 'User' | 'HawkerCentre';

const scopeToDataTypeMap: Record<Scope, DataType[]> = {
  inputs: ['Input'],
  inputsByDay: ['Input'],
  users: ['Input'],
  usersWithFavs: ['User'],
  percentageUsersWithFavs: ['Input', 'User'],
  hawkerCentreFavsCount: ['User', 'HawkerCentre'],
};

type Props = {
  scopes: Scope[];
  fromDate: string | undefined;
  toDate: string | undefined;
};

/**
 * Helper function to fetch the raw data at the start before performing analytics operations.
 */
export async function fetchData({ scopes, fromDate, toDate }: Props) {
  let inputs;
  let users;
  let hawkerCentres;

  const dataTypesToFetch = scopes.reduce(
    (_dataTypesToFetch: Set<DataType>, scope) => {
      scopeToDataTypeMap[scope].forEach((dataType) => {
        _dataTypesToFetch.add(dataType);
      });
      return _dataTypesToFetch;
    },
    new Set<DataType>(),
  );

  if (dataTypesToFetch.has('Input')) {
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

  if (dataTypesToFetch.has('User')) {
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

  if (dataTypesToFetch.has('HawkerCentre')) {
    const getAllHawkerCentresResult = await getAllHawkerCentres();
    if (getAllHawkerCentresResult.isErr) {
      return Result.Err('Error obtaining hawker centres');
    }
    hawkerCentres = getAllHawkerCentresResult.value;
  }

  return Result.Ok({ inputs, users, hawkerCentres });
}

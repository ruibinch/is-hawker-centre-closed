/* eslint-disable max-len */
import { getAllHawkerCentres } from '../../common/dynamodb';
import { HawkerCentreInfo } from '../../common/types';
import { MAX_CHOICES } from './constants';
import { FindHCByKeywordResponse } from './types';

const FAVOURITES_COMMANDS = ['/fav'];

export function isFavouritesCommand(s: string): boolean {
  const [command] = s.split(' ');
  return FAVOURITES_COMMANDS.includes(command);
}

export async function findHCByKeyword(
  keyword: string,
): Promise<FindHCByKeywordResponse | null> {
  return getAllHawkerCentres()
    .then((response) => {
      const items = response.Items as HawkerCentreInfo[];

      const hcFilteredByKeyword = filterByKeyword(items, keyword);

      // if there is only 1 result and the keyword is an exact match,
      // assume that this is after input selection, hence add to favourites
      if (hcFilteredByKeyword.length === 1) {
        if (keyword === hcFilteredByKeyword[0].name) {
          return {
            isExactMatch: true,
            hawkerCentres: hcFilteredByKeyword,
          };
        }
      }

      if (
        hcFilteredByKeyword.length === 0 ||
        hcFilteredByKeyword.length > MAX_CHOICES
      ) {
        return {
          isFindError: true,
          hawkerCentres: [],
        };
      }

      return {
        isFindError: false,
        hawkerCentres: hcFilteredByKeyword,
      };
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
}

/**
 * Filters the list of items by keyword matching the hawker centre name(s).
 */
function filterByKeyword(
  items: HawkerCentreInfo[],
  keyword: string,
): HawkerCentreInfo[] {
  if (keyword === '') {
    return [];
  }

  const filterRegex = new RegExp(`\\b${keyword.toLowerCase()}`);
  return items.filter(
    (item) =>
      filterRegex.test(item.name.toLowerCase()) ||
      (item.nameSecondary &&
        filterRegex.test(item.nameSecondary.toLowerCase())),
  );
}

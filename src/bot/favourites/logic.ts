/* eslint-disable max-len */
import { getAllHawkerCentres } from '../../common/dynamodb';
import { HawkerCentreInfo } from '../../dataCollection/types';
import { SearchHCResponse } from './types';

const FAVOURITES_COMMANDS = ['/fav'];
const MAX_CHOICES = 10;

export function isFavouritesCommand(s: string): boolean {
  const [command] = s.split(' ');
  return FAVOURITES_COMMANDS.includes(command);
}

export async function addNewHCToFavourites(
  keyword: string,
): Promise<SearchHCResponse | null> {
  return getAllHawkerCentres()
    .then((response) => {
      const items = response.Items as HawkerCentreInfo[];

      const hcFilteredByKeyword = filterByKeyword(items, keyword);

      // if there is only 1 result and the keyword is an exact match,
      // assume that this is after input selection, hence add to favourites
      if (hcFilteredByKeyword.length === 1) {
        const hcName = hcFilteredByKeyword[0].name;
        if (keyword === hcName) {
          // TODO: add to some favourites list

          return {
            message: `Great, adding *${hcName}* to your list of favourites\\!`,
          };
        }
      }

      if (hcFilteredByKeyword.length === 0) {
        return {
          message: `No results found${
            keyword.length > 0 ? ` for keyword *${keyword}*` : ''
          }\\. Try again?`,
        };
      }

      if (hcFilteredByKeyword.length > MAX_CHOICES) {
        return {
          message:
            'Too many results to be displayed, please further refine your search\\.',
        };
      }

      return {
        message:
          hcFilteredByKeyword.length === 1
            ? 'Confirm that this is the hawker centre to be added?'
            : 'Choose your favourite hawker centre:',
        // HACK: appending a /fav prefix so that this flow gets triggered again without needing to save any session state
        choices: hcFilteredByKeyword.map((hc) => `/fav ${hc.name}`),
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

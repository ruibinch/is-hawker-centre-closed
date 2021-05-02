import { HawkerCentreInfo, ResultPartial } from '../../models/types';
import { formatDate } from '../search';
import { MAX_CHOICES } from './constants';

export function makeAddHCMessage(props: {
  keyword: string;
  hawkerCentres: HawkerCentreInfo[];
}): string {
  const { keyword, hawkerCentres } = props;

  if (hawkerCentres.length === 0) {
    return `No results found${
      keyword.length > 0 ? ` for keyword *${keyword}*` : ''
    }\\. Try again?`;
  }

  if (hawkerCentres.length > MAX_CHOICES) {
    return 'Too many results to be displayed, please further refine your search\\.';
  }

  return hawkerCentres.length === 1
    ? 'Confirm that this is the hawker centre to be added?'
    : 'Choose your favourite hawker centre:';
}

export function makeSuccessfullyAddedMessage(
  hawkerCentres: HawkerCentreInfo[],
): string {
  if (hawkerCentres.length !== 1) {
    throw new Error('There should only be 1 hawker centre added');
  }

  const hcName = hawkerCentres[0].name;
  return `Great, adding *${hcName}* to your list of favourites\\!`;
}

export function makeDuplicateHCErrorMessage(
  hawkerCentre: HawkerCentreInfo,
): string {
  const { name: hcName } = hawkerCentre;
  return `*${hcName}* is already in your favourites list\\!`;
}

export function makeSuccessfullyDeletedMessage(
  hawkerCentre: HawkerCentreInfo | undefined,
): string {
  if (!hawkerCentre) {
    throw new Error('There should be 1 hawker centre deleted');
  }

  return `*${hawkerCentre.name}* has been deleted from your list of favourites\\.`;
}

export function makeDeleteOutOfBoundsMessage(
  numFavourites: number | undefined,
): string {
  if (!numFavourites) {
    throw new Error('The number of favourites is missing');
  }

  return (
    `That is not a valid index number\\. ` +
    `${
      numFavourites === 1
        ? 'The only valid value is 1\\.'
        : `Try again with a value from 1 to ${numFavourites}\\.`
    }`
  );
}

export function makeFavouritesListMessage(
  hawkerCentresWithResults: ResultPartial[],
): string {
  if (hawkerCentresWithResults.length === 0) {
    return "You've not added any favourites yet\\. Try adding some using the /fav command\\.";
  }

  const hcOutput = hawkerCentresWithResults
    .map((hc, idx) => {
      const { startDate, endDate } = hc;

      const nextClosureDetails =
        startDate && endDate
          ? `\n    _\\(${formatDate(startDate)} to ${formatDate(endDate)}\\)_`
          : '';

      return `${idx + 1}\\. *${hc.name}*${nextClosureDetails}`;
    })
    .join('\n');

  return `Your favourite hawker centres and their next closure dates are:\n\n${hcOutput}`;
}

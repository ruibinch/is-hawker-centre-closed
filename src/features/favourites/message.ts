import { HawkerCentreInfo } from '../../common/types';
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
    throw new Error('There should only be 1 result to be added');
  }

  const hcName = hawkerCentres[0].name;
  return `Great, adding *${hcName}* to your list of favourites\\!`;
}

export function makeFavouritesListMessage(
  hawkerCentres: HawkerCentreInfo[],
): string {
  if (hawkerCentres.length === 0) {
    return "You've not added any favourites yet\\. Try adding some using the /fav command\\.";
  }

  const hcOutput = hawkerCentres
    .map((hc, idx) => `${idx + 1}\\. *${hc.name}*`)
    .join('\n');

  return `Your favourite hawker centres are:\n\n${hcOutput}`;
}

export function makeDuplicateHCErrorMessage(
  hawkerCentre: HawkerCentreInfo,
): string {
  const { name: hcName } = hawkerCentre;
  return `*${hcName}* is already in your favourites list\\!`;
}

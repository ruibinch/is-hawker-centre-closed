import { t } from '../../lang';
import { HawkerCentreInfo, ResultPartial } from '../../models/types';
import { formatDate } from '../search';
import { MAX_CHOICES } from './constants';

export function makeAddHCMessage(props: {
  keyword: string;
  hawkerCentres: HawkerCentreInfo[];
}): string {
  const { keyword, hawkerCentres } = props;

  if (hawkerCentres.length === 0) {
    return t('favourites.error.no-results-found', {
      keywordSnippet: keyword.length > 0 ? ` for keyword *${keyword}*` : '',
    });
  }

  if (hawkerCentres.length > MAX_CHOICES) {
    return t('favourites.error.too-many-results');
  }

  return hawkerCentres.length === 1
    ? t('favourites.confirm-hawker-centre')
    : t('favourites.choose-favourite-hawker-centre');
}

export function makeSuccessfullyAddedMessage(
  hawkerCentre: HawkerCentreInfo,
): string {
  const { name: hcName } = hawkerCentre;
  return t('favourites.hawker-centre-added', { hcName });
}

export function makeDuplicateHCErrorMessage(
  hawkerCentre: HawkerCentreInfo,
): string {
  const { name: hcName } = hawkerCentre;
  return t('favourites.error.duplicate-hawker-centres', { hcName });
}

export function makeSuccessfullyDeletedMessage(
  hawkerCentre: HawkerCentreInfo,
): string {
  return t('favourites.hawker-centre-removed', { hcName: hawkerCentre.name });
}

export function makeDeleteErrorMessage(numFavourites: number): string {
  if (numFavourites === 0) {
    return makeNoSavedFavouritesMessage();
  }

  return (
    t('favourites.error.invalid-delete-index.first') +
    (numFavourites === 1
      ? t('favourites.error.invalid-delete-index.second.one-fav')
      : t('favourites.error.invalid-delete-index.second.multiple-favs', {
          numFavourites,
        }))
  );
}

export function makeFavouritesListMessage(
  hawkerCentresWithResults: ResultPartial[],
): string {
  if (hawkerCentresWithResults.length === 0) {
    return makeNoSavedFavouritesMessage();
  }

  const hcOutput = hawkerCentresWithResults
    .map((hc, idx) => {
      const { startDate, endDate } = hc;

      return t('favourites.item', {
        index: idx + 1,
        hcName: hc.name,
        nextClosureDetails:
          startDate && endDate
            ? t('favourites.item.closure-details', {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
              })
            : '',
      });
    })
    .join('\n');

  return t('favourites.list', {
    hcOutput,
  });
}

function makeNoSavedFavouritesMessage() {
  return t('favourites.error.no-saved-favourites');
}

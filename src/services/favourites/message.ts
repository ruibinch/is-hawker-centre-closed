import { t } from '../../lang';
import { ClosurePartial } from '../../models/Closure';
import { HawkerCentre } from '../../models/HawkerCentre';
import {
  makeClosurePeriodSnippet,
  makeClosureReasonSnippet,
  makeHawkerCentreName,
} from '../message';
import { MAX_CHOICES } from './constants';

export function makeAddHCMessage(props: {
  keyword: string;
  hawkerCentres: HawkerCentre[];
}): string {
  const { keyword, hawkerCentres } = props;

  if (hawkerCentres.length === 0) {
    return t('favourites.error.no-results-found', {
      keyword: t('favourites.snippet.keyword', { keyword }),
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
  hawkerCentre: HawkerCentre,
): string {
  const { name: hcName } = hawkerCentre;
  return t('favourites.hawker-centre-added', { hcName });
}

export function makeDuplicateHCErrorMessage(
  hawkerCentre: HawkerCentre,
): string {
  const { name: hcName } = hawkerCentre;
  return t('favourites.error.duplicate-hawker-centres', { hcName });
}

export function makeAddUnexpectedErrorMessage(): string {
  return t('favourites.error.add-fav');
}

export function makeSuccessfullyDeletedMessage(
  hawkerCentre: HawkerCentre,
): string {
  return t('favourites.hawker-centre-removed', { hcName: hawkerCentre.name });
}

export function makeDeleteUnexpectedErrorMessage(): string {
  return t('favourites.error.delete-fav');
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

export function makeListUnexpectedErrorMessage(): string {
  return t('favourites.error.list-favs');
}

export function makeFavouritesListMessage(
  hawkerCentresWithClosures: ClosurePartial[],
): string {
  if (hawkerCentresWithClosures.length === 0) {
    return makeNoSavedFavouritesMessage();
  }

  const hcOutput = hawkerCentresWithClosures
    .map((hc, idx) => {
      const { name, nameSecondary, startDate, endDate, reason } = hc;

      return t('favourites.item', {
        index: idx + 1,
        hcName: makeHawkerCentreName(name, nameSecondary),
        nextClosureDetails:
          startDate && endDate
            ? t('favourites.item.closure-details', {
                closurePeriod: makeClosurePeriodSnippet(startDate, endDate),
                closureReason: makeClosureReasonSnippet(reason),
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

export function makeReadNotificationsSettingMessage(
  currentValue: boolean | undefined,
): string {
  if (currentValue === undefined) {
    return (
      t('favourites.notifications.not-specified.first') +
      t('favourites.notifications.not-specified.second') +
      t('favourites.notifications.not-specified.third')
    );
  }

  return currentValue
    ? t('favourites.notifications.current-on') +
        t('favourites.notifications.toggle-prompt-off')
    : t('favourites.notifications.current-off') +
        t('favourites.notifications.toggle-prompt-on');
}

export function makeWriteNotificationsSettingMessage(
  newValue: boolean | undefined,
): string {
  if (newValue === undefined) {
    return t('favourites.notifications.unrecognised-keyword');
  }

  return newValue
    ? t('favourites.notifications.turned-on')
    : t('favourites.notifications.turned-off');
}

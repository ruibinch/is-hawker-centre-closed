import { t } from '../../lang';
import { HawkerCentre, ResultPartial } from '../../models/types';
import { formatDateDisplay } from '../../utils/date';
import { MAX_CHOICES } from './constants';

export function makeAddHCMessage(props: {
  keyword: string;
  hawkerCentres: HawkerCentre[];
}): string {
  const { keyword, hawkerCentres } = props;

  if (hawkerCentres.length === 0) {
    return t('favourites.error.no-results-found', {
      keyword: keyword.length > 0 ? ` for keyword *${keyword}*` : '',
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

export function makeSuccessfullyDeletedMessage(
  hawkerCentre: HawkerCentre,
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
      const { startDate, endDate, reason } = hc;

      return t('favourites.item', {
        index: idx + 1,
        hcName: hc.name,
        nextClosureDetails:
          startDate && endDate
            ? t('favourites.item.closure-details', {
                startDate: formatDateDisplay(startDate, true),
                endDate: formatDateDisplay(endDate, true),
                closureReason:
                  reason === 'renovation'
                    ? t('favourites.item.closure-reason', {
                        reason: t('common.closure-reason.renovation'),
                      })
                    : '',
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

  return (
    t('favourites.notifications.current', {
      currentValue: currentValue ? 'on' : 'off',
    }) +
    t('favourites.notifications.toggle-prompt', {
      desiredValue: currentValue ? 'off' : 'on',
    })
  );
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

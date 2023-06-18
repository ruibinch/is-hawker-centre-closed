import {
  addDays,
  addMonths,
  areIntervalsOverlapping,
  endOfDay,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import Fuse from 'fuse.js';

import { Result, type ResultType } from '../../../lib/Result';
import { getAllClosures, type Closure } from '../../../models/Closure';
import { HawkerCentre } from '../../../models/HawkerCentre';
import {
  HackyDate,
  currentDate,
  makeNextWeekInterval,
  makeThisWeekInterval,
} from '../../../utils/date';
import { getNextOccurringClosure, sortInAlphabeticalOrder } from '../helpers';
import {
  expandAcronymsAndSpellcheck,
  isRelevantKeyword,
} from './searchHelpers';
import { extractSearchModifier } from './searchModifier';
import type { SearchModifier, SearchObject, SearchResponse } from './types';

export async function processSearch(
  term: string,
  closuresArg?: Closure[],
): Promise<ResultType<SearchResponse, Error>> {
  const searchParams = parseSearchTerm(term);
  const { keyword, modifier } = searchParams;

  let closuresAll = closuresArg;
  if (!closuresAll) {
    const getAllClosuresResponse = await getAllClosures();
    if (getAllClosuresResponse.isErr) return getAllClosuresResponse;
    closuresAll = getAllClosuresResponse.value;
  }

  const closuresFilteredByKeyword = filterByKeyword(closuresAll, keyword);

  if (closuresFilteredByKeyword.length === 0) {
    return Result.Ok({
      params: searchParams,
      hasResults: false,
      closures: [],
    });
  }

  const closures =
    modifier === 'next'
      ? getNextClosuresForEachHC(closuresFilteredByKeyword)
      : filterByDate(closuresFilteredByKeyword, modifier);
  const closuresSorted = sortInAlphabeticalOrder(closures);

  return Result.Ok({
    params: searchParams,
    hasResults: true,
    closures: closuresSorted,
  });
}

/**
 * Splits the search term up into 2 components:
 * 1. Keyword
 * 2. Modifier
 */
function parseSearchTerm(term: string): SearchObject {
  const modifierResult = extractSearchModifier(term);

  if (modifierResult.isErr) {
    return {
      keyword: term,
      modifier: 'next', // defaults to next if no modifier
    };
  }

  const { modifier, index: modifierStartIndex } = modifierResult.value;
  return {
    keyword: term.slice(0, modifierStartIndex).trim(),
    modifier,
  };
}

/**
 * Filters the list of closures/hawker centres by keyword matching the hawker centre name/secondary name/keywords.
 * Searches across the individual words in the input keyword.
 */
export function filterByKeyword<T extends Closure | HawkerCentre>(
  items: T[],
  keyword: string,
): T[] {
  if (keyword === '') {
    return items;
  }

  const searchKeywords = keyword
    .split(' ')
    .map(expandAcronymsAndSpellcheck)
    .filter(isRelevantKeyword);

  const exactMatches = items.filter((item) => {
    return searchKeywords.every((searchKeyword) => {
      const filterRegex = new RegExp(`\\b${searchKeyword.toLowerCase()}`);
      return (
        filterRegex.test(item.name.toLowerCase()) ||
        (item.nameSecondary &&
          filterRegex.test(item.nameSecondary.toLowerCase())) ||
        (item.keywords &&
          item.keywords.some((hcKeyword) => filterRegex.test(hcKeyword)))
      );
    });
  });
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // only use fuzzy search when no exact matches are found
  const fuse = new Fuse(items, {
    includeScore: true,
    isCaseSensitive: false,
    ignoreLocation: true,
    threshold: 0.3, // TODO: to evaluate threshold
    keys: ['name', 'nameSecondary', 'keywords'],
  });

  const fuzzyMatchesWithScore = searchKeywords.reduce(
    (_fuzzyMatches: { item: T; score: number | undefined }[], k) => {
      const results = fuse.search(k);
      const matches = results.map((result) => ({
        item: result.item,
        score: result.score,
      }));

      _fuzzyMatches.push(...matches);
      return _fuzzyMatches;
    },
    [],
  );
  const fuzzyMatches = [...fuzzyMatchesWithScore]
    // best match comes first
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map((match) => match.item);

  return fuzzyMatches;
}

/**
 * Filters the list of closures by date based on the search modifier.
 */
function filterByDate(closures: Closure[], modifier: SearchModifier) {
  const makeInterval = (startDate: Date, endDate: Date) => ({
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  });

  const today = startOfDay(currentDate());

  return closures.filter((closure) => {
    const closureStartDate = parseISO(closure.startDate);
    const closureEndDate = parseISO(closure.endDate);

    return (() => {
      if (modifier === 'today') {
        return isWithinInterval(
          today,
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      if (modifier === 'tomorrow') {
        const tomorrowDate = addDays(today, 1);
        return isWithinInterval(
          tomorrowDate,
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      if (modifier === 'week') {
        const thisWeekInterval = makeThisWeekInterval(today);
        return areIntervalsOverlapping(
          thisWeekInterval,
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      if (modifier === 'nextWeek') {
        const nextWeekInterval = makeNextWeekInterval(today);
        return areIntervalsOverlapping(
          nextWeekInterval,
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      if (modifier === 'month') {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        return areIntervalsOverlapping(
          makeInterval(monthStart, monthEnd),
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      if (modifier === 'nextMonth') {
        const nextMonthStart = startOfMonth(addMonths(today, 1));
        const nextMonthEnd = endOfMonth(addMonths(today, 1));
        return areIntervalsOverlapping(
          makeInterval(nextMonthStart, nextMonthEnd),
          makeInterval(closureStartDate, closureEndDate),
        );
      }
      /* istanbul ignore next */
      return false;
    })();
  });
}

/**
 * Returns a list of upcoming closures for each hawker centre in the input closures list.
 * If the hawker centre has no upcoming closure, return a dummy closure object with start/end date set to "2122-01-01".
 */
function getNextClosuresForEachHC(closures: Closure[]) {
  const closuresByHC = closures.reduce(
    (obj: Record<string, Closure[]>, closureEntry) => {
      obj[closureEntry.hawkerCentreId] = [
        ...(obj[closureEntry.hawkerCentreId] ?? []),
        closureEntry,
      ];
      return obj;
    },
    {},
  );

  const nextClosuresByHC = Object.entries(closuresByHC).reduce(
    (_nextClosuresByHC: Record<string, Closure>, closuresByHCEntry) => {
      const [hawkerCentreId, hawkerCentreClosures] = closuresByHCEntry;

      // If the hawker centre has a next occurring closure, return it, else we return a dummy value
      // This avoids the hawker centre from being omitted entirely in the output list
      const nextOccurringClosureWithFallback: Closure | undefined = (() => {
        const nextOccurringClosure =
          getNextOccurringClosure(hawkerCentreClosures);
        if (nextOccurringClosure) return nextOccurringClosure;

        // If this hawker centre doesn't even have any reference Closure object, just ignore it for convenience's sake
        const sampleClosureObject: Closure | undefined =
          hawkerCentreClosures[0];
        if (!sampleClosureObject) return undefined;

        // Set start/end date to dummy date, reset reason and remarks to prevent additional output details
        return {
          ...sampleClosureObject,
          startDate: HackyDate.NO_NEXT_CLOSURE_DATE_AVAILABLE,
          endDate: HackyDate.NO_NEXT_CLOSURE_DATE_AVAILABLE,
          reason: 'cleaning',
          remarks: null,
          id: `${hawkerCentreId}__${HackyDate.NO_NEXT_CLOSURE_DATE_AVAILABLE}`,
        };
      })();

      if (nextOccurringClosureWithFallback) {
        _nextClosuresByHC[hawkerCentreId] = nextOccurringClosureWithFallback;
      }
      return _nextClosuresByHC;
    },
    {},
  );

  return Object.values(nextClosuresByHC);
}

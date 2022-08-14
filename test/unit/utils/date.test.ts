import { parseISO } from 'date-fns';

import {
  makeNextWeekInterval,
  makeThisWeekInterval,
} from '../../../src/utils/date';

describe('[unit] utils > date', () => {
  describe('makeThisWeekInterval', () => {
    test("when today's date is Monday 00:00:00", () => {
      expect(
        makeThisWeekInterval(parseISO('2021-01-25T00:00:00.000Z')),
      ).toStrictEqual({
        start: parseISO('2021-01-25T00:00:00.000Z'),
        end: parseISO('2021-01-31T23:59:59.999Z'),
      });
    });

    test("when today's date is Sunday 23:59:59", () => {
      expect(
        makeThisWeekInterval(parseISO('2021-01-31T23:59:59.999Z')),
      ).toStrictEqual({
        start: parseISO('2021-01-25T00:00:00.000Z'),
        end: parseISO('2021-01-31T23:59:59.999Z'),
      });
    });
  });

  describe('makeNextWeekInterval', () => {
    test("when today's date is Monday 00:00:00", () => {
      expect(
        makeNextWeekInterval(parseISO('2021-01-25T00:00:00.000Z')),
      ).toStrictEqual({
        start: parseISO('2021-02-01T00:00:00.000Z'),
        end: parseISO('2021-02-07T23:59:59.999Z'),
      });
    });

    test("when today's date is Sunday 23:59:59", () => {
      expect(
        makeNextWeekInterval(parseISO('2021-01-31T23:59:59.999Z')),
      ).toStrictEqual({
        start: parseISO('2021-02-01T00:00:00.000Z'),
        end: parseISO('2021-02-07T23:59:59.999Z'),
      });
    });
  });
});

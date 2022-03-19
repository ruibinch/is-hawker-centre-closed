import { parseISO } from 'date-fns';

import { Input } from '../../../src/models/Input';
import { User } from '../../../src/models/User';
import {
  filterItemsByDate,
  filterInputByUserId,
  filterUserByUserId,
} from '../../../src/server/filters';

describe('[unit] server > filters', () => {
  let dateSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-06-04T15:26:35').valueOf());
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  describe('Input filters', () => {
    let input: Input;

    beforeAll(() => {
      input = Input.create({
        inputId: 'dummyInputId',
        userId: 1,
        username: 'ashketchum',
        text: '/start',
      });
    });

    describe('filterInputByUserId', () => {
      it('returns true when input userId matches', () => {
        expect(filterInputByUserId(input, 1)).toBeTruthy();
      });

      it('returns true when input userId is undefined', () => {
        expect(filterInputByUserId(input, undefined)).toBeTruthy();
      });

      it('returns false when input userId does not match', () => {
        expect(filterInputByUserId(input, 2)).toBeFalsy();
      });
    });

    describe('filterInputByDate', () => {
      it('returns true when input falls within fromDate and toDate', () => {
        expect(
          filterItemsByDate(input, '2021-06-01', '2021-06-30'),
        ).toBeTruthy();
      });

      it('returns true when input is after the specified fromDate', () => {
        expect(filterItemsByDate(input, '2021-06-01', undefined)).toBeTruthy();
      });

      it('returns true when input is before the specified toDate', () => {
        expect(filterItemsByDate(input, undefined, '2021-06-30')).toBeTruthy();
      });

      it('returns true when fromDate and toDate are undefined', () => {
        expect(filterItemsByDate(input, undefined, undefined)).toBeTruthy();
      });

      it('returns false when input is before the specified fromDate', () => {
        expect(
          filterItemsByDate(input, '2021-06-05', '2021-06-30'),
        ).toBeFalsy();
      });

      it('returns false when input is after the specified toDate', () => {
        expect(
          filterItemsByDate(input, '2021-06-01', '2021-06-03'),
        ).toBeFalsy();
      });
    });
  });

  describe('User filters', () => {
    let user: User;

    beforeAll(() => {
      user = User.create({
        userId: 1,
        username: 'ashketchum',
        languageCode: 'en',
        favourites: [],
        isInFavouritesMode: false,
        notifications: false,
      });
    });

    describe('filterUserByUserId', () => {
      it('returns true when input userId matches', () => {
        expect(filterUserByUserId(user, 1)).toBeTruthy();
      });

      it('returns true when input userId is undefined', () => {
        expect(filterUserByUserId(user, undefined)).toBeTruthy();
      });

      it('returns false when input userId does not match', () => {
        expect(filterUserByUserId(user, 2)).toBeFalsy();
      });
    });
  });
});

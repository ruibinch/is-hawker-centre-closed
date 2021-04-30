import { parseISO } from 'date-fns';

import { ClosureReason } from '../../../src/common/types';
import {
  addHCToFavourites,
  deleteHCFromFavourites,
  findHCByKeyword,
  getUserFavouritesWithResults,
} from '../../../src/features/favourites';
import {
  mockHawkerCentres,
  mockResults,
  mockTelegramUser,
  mockUser,
} from '../../__mocks__/db';

// TODO: shift this to a __mocks__ folder and rework mocks to be more specific
jest.mock('../../../src/common/dynamodb', () => ({
  getAllResults: () => Promise.resolve({ Items: mockResults }),
  getAllHawkerCentres: () => Promise.resolve({ Items: mockHawkerCentres }),
  getHawkerCentreById: () => Promise.resolve({ Item: mockHawkerCentres[0] }),
  getUserById: () => Promise.resolve({ Item: mockUser }),
  updateUser: () => Promise.resolve(),
}));

describe('bot > features > favourites > logic', () => {
  let dateSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  describe('findHCByKeyword', () => {
    it('["oldale"] returns a single result', async () => {
      await findHCByKeyword('oldale').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeFalsy();
          expect(hawkerCentres).toHaveLength(1);
        }
      });
    });

    it('["fortree"] returns multiple choices for selection', async () => {
      await findHCByKeyword('fortree').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeFalsy();
          expect(hawkerCentres).toHaveLength(2);
        }
      });
    });

    it('["psychic"] searches on secondary name', async () => {
      await findHCByKeyword('psychic').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeFalsy();
          expect(hawkerCentres).toHaveLength(1);
        }
      });
    });

    it('["Slateport Market"] an exact match will add it to the favourites list', async () => {
      await findHCByKeyword('Slateport Market').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeTruthy();
          expect(isFindError).toBeFalsy();
          expect(hawkerCentres).toHaveLength(1);
        }
      });
    });

    it('["lilycove"] returns an error message when there are no results', async () => {
      await findHCByKeyword('lilycove').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeTruthy();
          expect(hawkerCentres).toHaveLength(0);
        }
      });
    });

    it('["gym"] returns an error message when there are too many results', async () => {
      await findHCByKeyword('gym').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeTruthy();
          expect(hawkerCentres).toHaveLength(0);
        }
      });
    });

    it('[""] empty keyword returns no results', async () => {
      await findHCByKeyword('').then((response) => {
        expect(response).toBeDefined();

        if (response) {
          const { isExactMatch, isFindError, hawkerCentres } = response;

          expect(isExactMatch).toBeFalsy();
          expect(isFindError).toBeTruthy();
          expect(hawkerCentres).toHaveLength(0);
        }
      });
    });
  });

  describe('addHCToFavourites', () => {
    it('successfully adds the hawker centre to the favourites list', async () => {
      const mockHawkerCentre = mockHawkerCentres[1];
      await addHCToFavourites({
        hawkerCentre: mockHawkerCentre,
        telegramUser: mockTelegramUser,
      }).then((addHCResponse) => {
        expect(addHCResponse).toBeDefined();

        if (addHCResponse) {
          const { success, isDuplicate } = addHCResponse;

          expect(success).toBeTruthy();
          expect(isDuplicate).toBeFalsy();
        }
      });
    });

    it('returns a duplicate error message when hawker centre is already in the favourites list', async () => {
      const mockHawkerCentre = mockHawkerCentres[0];
      await addHCToFavourites({
        hawkerCentre: mockHawkerCentre,
        telegramUser: mockTelegramUser,
      }).then((addHCResponse) => {
        expect(addHCResponse).toBeDefined();

        if (addHCResponse) {
          const { success, isDuplicate } = addHCResponse;

          expect(success).toBeFalsy();
          expect(isDuplicate).toBeTruthy();
        }
      });
    });
  });

  describe('deleteHCFromFavourites', () => {
    it('successfully deletes the hawker centre from the favourites list', async () => {
      await deleteHCFromFavourites({
        deleteIdx: 1,
        telegramUser: mockTelegramUser,
      }).then((deleteHCResponse) => {
        expect(deleteHCResponse).toBeDefined();

        if (deleteHCResponse) {
          const { success, hawkerCentre } = deleteHCResponse;

          expect(success).toBeTruthy();
          expect(hawkerCentre).toBeDefined();
          expect(hawkerCentre).toStrictEqual({
            hawkerCentreId: 1,
            name: 'Littleroot Town',
          });
        }
      });
    });
  });

  describe('getUserFavouritesWithResults', () => {
    it("correctly returns the user's favourite hawker centres with results", async () => {
      await getUserFavouritesWithResults(mockTelegramUser).then(
        (getUserResponse) => {
          expect(getUserResponse).toBeDefined();

          if (getUserResponse) {
            expect(getUserResponse).toHaveLength(3);
            expect(getUserResponse).toContainEqual({
              hawkerCentreId: 1,
              name: 'Littleroot Town',
            });
            expect(getUserResponse).toContainEqual({
              id: '111',
              hawkerCentreId: 6,
              name: 'Verdanturf Town',
              reason: ClosureReason.cleaning,
              startDate: '2021-02-08',
              endDate: '2021-02-09',
            });
            expect(getUserResponse).toContainEqual({
              hawkerCentreId: 37,
              name: 'Mossdeep Gym',
              nameSecondary: 'Psychics in space',
            });
          }
        },
      );
    });
  });
});

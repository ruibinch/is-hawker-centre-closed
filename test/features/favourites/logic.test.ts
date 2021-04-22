import { findHCByKeyword } from '../../../src/features/favourites';
import { mockHawkerCentres } from '../../__mocks__/db';

// TODO: shift this to a __mocks__ folder
jest.mock('../../../src/common/dynamodb', () => ({
  getAllHawkerCentres: () => Promise.resolve({ Items: mockHawkerCentres }),
}));

describe('bot > features > favourites', () => {
  describe('findHCByKeyword', () => {
    it('["slateport"] returns a single result', async () => {
      await findHCByKeyword('slateport').then((response) => {
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

    it('["oldale"] returns an error message when there are no results', async () => {
      await findHCByKeyword('oldale').then((response) => {
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
});

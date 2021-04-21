import { addNewHCToFavourites } from '../../../src/bot/favourites/logic';
import { mockHawkerCentres } from '../../__mocks__/db';

// TODO: shift this to a __mocks__ folder
jest.mock('../../../src/common/dynamodb', () => ({
  getAllHawkerCentres: () => Promise.resolve({ Items: mockHawkerCentres }),
}));

describe('bot > favourites', () => {
  describe('addNewHCToFavourites', () => {
    it('["slateport"] returns a single choice', async () => {
      await addNewHCToFavourites('slateport').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual(
            'Confirm that this is the hawker centre to be added?',
          );
          expect(choices).toHaveLength(1);
          expect(choices).toContainEqual(
            expect.stringMatching('/fav Slateport Market'),
          );
        }
      });
    });

    it('["fortree"] returns multiple choices for selection', async () => {
      await addNewHCToFavourites('fortree').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual(`Choose your favourite hawker centre:`);
          expect(choices).toHaveLength(2);
          expect(choices).toContainEqual(
            expect.stringMatching('/fav Fortree Market'),
          );
          expect(choices).toContainEqual(
            expect.stringMatching('/fav Fortree Gym'),
          );
        }
      });
    });

    it('["psychic"] searches on secondary name', async () => {
      await addNewHCToFavourites('psychic').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual(
            'Confirm that this is the hawker centre to be added?',
          );
          expect(choices).toHaveLength(1);
          expect(choices).toContainEqual(
            expect.stringMatching('/fav Mossdeep Gym'),
          );
        }
      });
    });

    it('["Slateport Market"] an exact match will add it to the favourites list', async () => {
      await addNewHCToFavourites('Slateport Market').then(
        (searchHCResponse) => {
          expect(searchHCResponse).toBeDefined();

          if (searchHCResponse) {
            const { message, choices } = searchHCResponse;

            expect(message).toStrictEqual(
              `Great, adding *Slateport Market* to your list of favourites\\!`,
            );
            expect(choices).toBeUndefined();
          }
        },
      );
    });

    it('["oldale"] returns an error message when there are no results', async () => {
      await addNewHCToFavourites('oldale').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual(
            'No results found for keyword *oldale*\\. Try again?',
          );
          expect(choices).toBeUndefined();
        }
      });
    });

    it('["gym"] returns an error message when there are too many results', async () => {
      await addNewHCToFavourites('gym').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual(
            'Too many results to be displayed, please further refine your search\\.',
          );
          expect(choices).toBeUndefined();
        }
      });
    });

    it('[""] empty keyword returns no results', async () => {
      await addNewHCToFavourites('').then((searchHCResponse) => {
        expect(searchHCResponse).toBeDefined();

        if (searchHCResponse) {
          const { message, choices } = searchHCResponse;

          expect(message).toStrictEqual('No results found\\. Try again?');
          expect(choices).toBeUndefined();
        }
      });
    });
  });
});

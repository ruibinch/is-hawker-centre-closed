import {
  makeAddHCMessage,
  makeDeleteOutOfBoundsMessage,
  makeDuplicateHCErrorMessage,
  makeFavouritesListMessage,
  makeSuccessfullyAddedMessage,
  makeSuccessfullyDeletedMessage,
} from '../../../src/features/favourites';
import { mockHawkerCentres } from '../../__mocks__/db';

describe('bot > features > favourites', () => {
  describe('makeAddHCMessage', () => {
    it.each([
      [
        'no results found with an empty keyword',
        {
          inputs: {
            keyword: '',
            hawkerCentres: [],
          },
          expected: {
            message: 'No results found\\. Try again?',
          },
        },
      ],
      [
        'no results found with specified keyword',
        {
          inputs: {
            keyword: 'oldale',
            hawkerCentres: [],
          },
          expected: {
            message: 'No results found for keyword *oldale*\\. Try again?',
          },
        },
      ],
      [
        'too many results found',
        {
          inputs: {
            keyword: 'gym',
            hawkerCentres: mockHawkerCentres.filter(
              (hc) => hc.name.toLowerCase().search('gym') !== -1,
            ),
          },
          expected: {
            message:
              'Too many results to be displayed, please further refine your search\\.',
          },
        },
      ],
      [
        'one result found',
        {
          inputs: {
            keyword: 'slateport',
            hawkerCentres: [
              {
                hawkerCentreId: 2,
                name: 'Slateport Market',
              },
            ],
          },
          expected: {
            message: 'Confirm that this is the hawker centre to be added?',
          },
        },
      ],
      [
        'multiple results found',
        {
          inputs: {
            keyword: 'fortree',
            hawkerCentres: [
              {
                hawkerCentreId: 3,
                name: 'Fortree Market',
              },
              {
                hawkerCentreId: 16,
                name: 'Fortree Gym',
                nameSecondary: 'Treehouse living',
              },
            ],
          },
          expected: {
            message: 'Choose your favourite hawker centre:',
          },
        },
      ],
    ])(
      '%s',
      (
        testName,
        {
          inputs: { keyword, hawkerCentres },
          expected: { message: expectedMessage },
        },
      ) => {
        const message = makeAddHCMessage({
          keyword,
          hawkerCentres,
        });

        expect(message).toEqual(expectedMessage);
      },
    );
  });

  describe('makeSuccessfullyAddedMessage', () => {
    it('returns the correct success message', () => {
      const message = makeSuccessfullyAddedMessage([
        {
          hawkerCentreId: 2,
          name: 'Slateport Market',
        },
      ]);

      expect(message).toEqual(
        `Great, adding *Slateport Market* to your list of favourites\\!`,
      );
    });

    it('throws an error when the number of results is not one', () => {
      expect(() => {
        makeSuccessfullyAddedMessage([]);
      }).toThrow();
    });
  });

  describe('makeDuplicateHCErrorMessage', () => {
    it('returns the correct error message', () => {
      const message = makeDuplicateHCErrorMessage({
        hawkerCentreId: 2,
        name: 'Slateport Market',
      });

      expect(message).toEqual(
        `*Slateport Market* is already in your favourites list\\!`,
      );
    });
  });

  describe('makeSuccessfullyDeletedMessage', () => {
    it('returns the correct success message', () => {
      const message = makeSuccessfullyDeletedMessage({
        hawkerCentreId: 2,
        name: 'Slateport Market',
      });

      expect(message).toEqual(
        `*Slateport Market* has been deleted from your list of favourites\\.`,
      );
    });

    it('throws an error when the input value is undefined', () => {
      expect(() => {
        makeSuccessfullyDeletedMessage(undefined);
      }).toThrow();
    });
  });

  describe('makeDeleteOutOfBoundsMessage', () => {
    it('returns the correct success message, when the number of favourites is 1', () => {
      const message = makeDeleteOutOfBoundsMessage(1);

      expect(message).toEqual(
        `That is not a valid index number\\. The only valid value is 1\\.`,
      );
    });

    it('returns the correct success message, when the number of favourites is not 1', () => {
      const message = makeDeleteOutOfBoundsMessage(5);

      expect(message).toEqual(
        `That is not a valid index number\\. Try again with a value from 1 to 5\\.`,
      );
    });

    it('throws an error when the input value is undefined', () => {
      expect(() => {
        makeDeleteOutOfBoundsMessage(undefined);
      }).toThrow();
    });
  });

  describe('makeFavouritesListMessage', () => {
    it('returns the list of favourites when it is defined', () => {
      const message = makeFavouritesListMessage([
        {
          hawkerCentreId: 2,
          name: 'Slateport Market',
        },
        {
          hawkerCentreId: 3,
          name: 'Fortree Market',
        },
        {
          hawkerCentreId: 11,
          name: 'Rustboro Gym',
          nameSecondary: 'Rocky road ahead',
        },
      ]);

      expect(message).toEqual(
        `Your favourite hawker centres are:\n\n` +
          `1\\. *Slateport Market*\n` +
          `2\\. *Fortree Market*\n` +
          `3\\. *Rustboro Gym*`,
      );
    });

    it('returns a prompt to add some favourites when there are no favourites defined', () => {
      const message = makeFavouritesListMessage([]);

      expect(message).toEqual(
        "You've not added any favourites yet\\. Try adding some using the /fav command\\.",
      );
    });
  });
});

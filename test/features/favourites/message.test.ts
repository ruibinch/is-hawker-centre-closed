import {
  makeMessage,
  makeSuccessfullyAddedMessage,
} from '../../../src/features/favourites';
import { mockHawkerCentres } from '../../__mocks__/db';

describe('bot > features > favourites', () => {
  describe('makeMessage', () => {
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
        const message = makeMessage({
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
});

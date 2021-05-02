/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import { processSearch } from '..';
import { mockResults } from '../../../models/__mocks__/db';

// TODO: shift this to a __mocks__ folder
jest.mock('../../../models/Result', () => ({
  getAllResults: () => Promise.resolve({ Items: mockResults }),
}));

describe('features > search > logic', () => {
  describe('data exists in DB', () => {
    let dateSpy: jest.SpyInstance;

    beforeEach(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01').valueOf());
    });

    afterEach(() => {
      dateSpy.mockRestore();
    });

    it('["littleroot"] returns a single result occurring today', async () => {
      await processSearch('littleroot').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(1);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Littleroot Town',
              startDate: '2021-01-01',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["littleroot today"] returns a single result occurring today', async () => {
      await processSearch('littleroot today').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(1);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Littleroot Town',
              startDate: '2021-01-01',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["rustboro"] does not return any result if there is no result occurring today', async () => {
      await processSearch('rustboro').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;
          expect(results).toHaveLength(0);
        }
      });
    });

    it('["slateport tmr"] returns all results occurring tomorrow', async () => {
      await processSearch('slateport tmr').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(1);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Slateport City',
              startDate: '2021-01-02',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["slateport tomorrow"] returns all results occurring tomorrow', async () => {
      await processSearch('slateport tomorrow').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(1);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Slateport City',
              startDate: '2021-01-02',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["oldale month"] returns results occurring in the current month', async () => {
      await processSearch('oldale month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(2);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Oldale Town',
              startDate: '2021-01-15',
              endDate: '2021-01-18',
            }),
          );
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Oldale Town',
              startDate: '2021-01-30',
              endDate: '2021-01-31',
            }),
          );
        }
      });
    });

    it('["verdanturf next month"] returns results occurring in the next month', async () => {
      await processSearch('verdanturf next month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(1);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Verdanturf Town',
              startDate: '2021-02-08',
              endDate: '2021-02-09',
            }),
          );
        }
      });
    });

    it('["Today"] returns all results occurring today', async () => {
      await processSearch('Today').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(2);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Littleroot Town',
              startDate: '2021-01-01',
              endDate: '2021-01-02',
            }),
          );
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Melville City',
              startDate: '2021-01-01',
              endDate: '2021-01-01',
            }),
          );
        }
      });
    });

    it('["Tmr"] returns all results occurring tomorrow', async () => {
      await processSearch('Tmr').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(2);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Littleroot Town',
              startDate: '2021-01-01',
              endDate: '2021-01-02',
            }),
          );
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Slateport City',
              startDate: '2021-01-02',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["Tomorrow"] returns all results occurring tomorrow', async () => {
      await processSearch('Tomorrow').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(2);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Littleroot Town',
              startDate: '2021-01-01',
              endDate: '2021-01-02',
            }),
          );
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Slateport City',
              startDate: '2021-01-02',
              endDate: '2021-01-02',
            }),
          );
        }
      });
    });

    it('["Month"] returns all results occurring in the current month', async () => {
      await processSearch('Month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(5);
          mockResults.slice(0, 5).forEach((entry) => {
            expect(results).toContainEqual(entry);
          });
        }
      });
    });

    it('["Next month"] returns all results occurring in the next month', async () => {
      await processSearch('Next month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results } = searchResponse;

          expect(results).toHaveLength(2);
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Rustboro City',
              startDate: '2021-02-02',
              endDate: '2021-02-05',
            }),
          );
          expect(results).toContainEqual(
            expect.objectContaining({
              name: 'Verdanturf Town',
              startDate: '2021-02-08',
              endDate: '2021-02-09',
            }),
          );
        }
      });
    });
  });

  describe('data does not exist in DB', () => {
    let dateSpy: jest.SpyInstance;

    beforeEach(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-03-01').valueOf());
    });

    afterEach(() => {
      dateSpy.mockRestore();
    });

    it('["Today"] returns no results', async () => {
      await processSearch('Today').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results, isDataPresent } = searchResponse;
          expect(results).toHaveLength(0);
          expect(isDataPresent).toBeUndefined();
        }
      });
    });

    it('["Tmr"] returns no results', async () => {
      await processSearch('Tmr').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results, isDataPresent } = searchResponse;
          expect(results).toHaveLength(0);
          expect(isDataPresent).toBeUndefined();
        }
      });
    });

    it('["Tomorrow"] returns no results', async () => {
      await processSearch('Tomorrow').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results, isDataPresent } = searchResponse;
          expect(results).toHaveLength(0);
          expect(isDataPresent).toBeUndefined();
        }
      });
    });

    it('["Month"] returns no results', async () => {
      await processSearch('Month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results, isDataPresent } = searchResponse;
          expect(results).toHaveLength(0);
          expect(isDataPresent).toBeUndefined();
        }
      });
    });

    it('["Next month"] returns search response object with isDataPresent set to false', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-02-01').valueOf());

      await processSearch('Next month').then((searchResponse) => {
        expect(searchResponse).toBeDefined();

        if (searchResponse) {
          const { results, isDataPresent } = searchResponse;
          expect(results).toHaveLength(0);
          expect(isDataPresent).toStrictEqual(false);
        }
      });
    });
  });
});

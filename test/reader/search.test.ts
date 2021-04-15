import { parseISO } from 'date-fns';

import { processSearch } from '../../src/reader/search';
import { mockTable } from '../__mocks__/db';

// TODO: shift this to a __mocks__ folder
jest.mock('../../src/common/dynamodb', () => ({
  getTableData: () => Promise.resolve({ Items: mockTable }),
}));

describe('reader > search', () => {
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => parseISO('2021-01-01').valueOf());
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
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Littleroot Town',
          startDate: '2021-01-01',
          endDate: '2021-01-02',
        });
      }
    });
  });

  it('["littleroot today"] returns a single result occurring today', async () => {
    await processSearch('littleroot today').then((searchResponse) => {
      expect(searchResponse).toBeDefined();

      if (searchResponse) {
        const { results } = searchResponse;

        expect(results).toHaveLength(1);
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Littleroot Town',
          startDate: '2021-01-01',
          endDate: '2021-01-02',
        });
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

  it('["rustboro month"] returns a single result occurring in the current month', async () => {
    await processSearch('rustboro month').then((searchResponse) => {
      expect(searchResponse).toBeDefined();

      if (searchResponse) {
        const { results } = searchResponse;

        expect(results).toHaveLength(1);
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Rustboro City',
          startDate: '2021-01-25',
          endDate: '2021-01-29',
        });
      }
    });
  });

  it('["oldale month"] returns multiple results occurring in the current month', async () => {
    await processSearch('oldale month').then((searchResponse) => {
      expect(searchResponse).toBeDefined();

      if (searchResponse) {
        const { results } = searchResponse;

        expect(results).toHaveLength(2);
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Oldale Town',
          startDate: '2021-01-15',
          endDate: '2021-01-18',
        });
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Oldale Town',
          startDate: '2021-01-30',
          endDate: '2021-01-31',
        });
      }
    });
  });

  it('["today"] returns all results occurring today', async () => {
    await processSearch('today').then((searchResponse) => {
      expect(searchResponse).toBeDefined();

      if (searchResponse) {
        const { results } = searchResponse;

        expect(results).toHaveLength(2);
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Littleroot Town',
          startDate: '2021-01-01',
          endDate: '2021-01-02',
        });
        expect(results).toContainEqual({
          id: '1111111111',
          hawkerCentre: 'Melville City',
          startDate: '2021-01-01',
          endDate: '2021-01-04',
        });
      }
    });
  });

  it('["month"] returns all results occurring in the current month', async () => {
    await processSearch('month').then((searchResponse) => {
      expect(searchResponse).toBeDefined();

      if (searchResponse) {
        const { results } = searchResponse;

        expect(results).toHaveLength(5);
        mockTable.slice(0, 5).forEach((entry) => {
          expect(results).toContainEqual(entry);
        });
      }
    });
  });
});

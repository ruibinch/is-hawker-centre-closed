import { filterByKeyword } from '../../../src/bot/services/search';
import hcKeywords from '../../../src/dataCollection/hcKeywords';
import { Closure } from '../../../src/models/Closure';
import hawkerCentresData from '../../mockData/mockHawkerCentres.json';

describe('[unit] bot > search', () => {
  const closures: Array<Pick<Closure, 'name' | 'nameSecondary' | 'keywords'>> =
    hawkerCentresData.map((hc) => ({
      name: hc.name,
      nameSecondary: hc.nameSecondary,
      keywords: hcKeywords[hc.name],
    }));

  describe('filterByKeyword', () => {
    const runSearch = (keyword: string) => {
      // @ts-expect-error skip irrelevant Closure props
      const results = filterByKeyword(closures, keyword);
      return results;
    };

    it('searches on hawker centre name', () => {
      expect(runSearch('berseh food centre')).toHaveLength(1);
      expect(runSearch('ang mo kio 341')).toHaveLength(1);
      expect(runSearch('yishun ring road')).toHaveLength(1);
    });

    it('searches on hawker centre secondary name', () => {
      expect(runSearch('fengshan')).toHaveLength(1);
      expect(runSearch('hong lim')).toHaveLength(1);
      expect(runSearch('tekka')).toHaveLength(1);
      expect(runSearch('tampines round market')).toHaveLength(1);
    });

    it('searches on hawker centre keywords', () => {
      expect(runSearch('botanic')).toContainEqual(
        expect.objectContaining({
          name: 'Adam Road Food Centre',
          keywords: ['botanic'],
        }),
      );
      expect(runSearch('HEARTBEAT')).toContainEqual(
        expect.objectContaining({
          name: 'Bedok North Street 1 Blk 216',
          keywords: ['heartbeat'],
        }),
      );
      expect(runSearch('kew')).toContainEqual(
        expect.objectContaining({
          name: 'Bedok Food Centre',
          keywords: ['kew'],
        }),
      );
      expect(runSearch('mei ling')).toContainEqual(
        expect.objectContaining({
          name: 'Mei Chin Road Blk 159',
          keywords: ['mei ling', 'meiling', 'stirling'],
        }),
      );
    });

    it('expands search term', () => {
      expect(runSearch('ECP')).toContainEqual(
        expect.objectContaining({
          name: 'East Coast Lagoon Food Village',
        }),
      );
      expect(runSearch('Havelock rd')).toContainEqual(
        expect.objectContaining({
          name: 'Havelock Road Blk 22A/B',
        }),
      );
      expect(runSearch('Jln Kukoh')).toContainEqual(
        expect.objectContaining({
          name: 'Jalan Kukoh Blk 1',
        }),
      );
      expect(runSearch('LAS')).toContainEqual(
        expect.objectContaining({
          name: 'Hougang Ave 1 Blk 105',
          keywords: ['lorong ah soo'],
        }),
      );
      expect(runSearch('lor 7')).toContainEqual(
        expect.objectContaining({
          name: 'Toa Payoh Lorong 7 Blk 22',
        }),
      );
      expect(runSearch('oth')).toContainEqual(
        expect.objectContaining({
          name: 'Our Tampines Hub',
        }),
      );
      expect(runSearch('Smith ST')).toContainEqual(
        expect.objectContaining({
          name: 'Smith Street Blk 335',
        }),
      );
      expect(runSearch('TAMP round')).toContainEqual(
        expect.objectContaining({
          name: 'Tampines Street 11 Blk 137',
          nameSecondary: 'Tampines Round Market and Food Centre',
        }),
      );
    });

    it('filters out irrelevant keywords', () => {
      expect(runSearch('yishun park OPENING HOURS')).toHaveLength(1);
      expect(runSearch('eunos fOOD Fare')).toHaveLength(1);
      expect(runSearch('Bedok Hawker Centre')).toHaveLength(9);
    });
  });
});

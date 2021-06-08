/* eslint-disable max-len */
import { parseISO } from 'date-fns';
import { Err, Ok } from 'ts-results';

import * as sender from '../src/bot/sender';
import { initDictionary, t } from '../src/lang';
import * as ClosureFile from '../src/models/Closure';
import * as favouritesIndex from '../src/services/favourites/index';
import { mockClosures } from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Search module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Err.EMPTY));

    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Ok(mockClosures)));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
  });

  describe('when data exists in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01T11:30:25').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["littleroot"] returns a single closure occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.present', {
          keyword: 'containing the keyword *littleroot* ',
          timePeriod: 'today',
        }) +
        t('search.item', {
          hcName: 'Littleroot Town',
          closurePeriod: t('common.time.time-period', {
            startDate: t('common.time.today'),
            endDate: t('common.time.tomorrow'),
          }),
          closureReason: '',
        });

      await callBot('littleroot');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["littleroot today"] returns a single closure occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.present', {
          keyword: 'containing the keyword *littleroot* ',
          timePeriod: 'today',
        }) +
        t('search.item', {
          hcName: 'Littleroot Town',
          closurePeriod: t('common.time.time-period', {
            startDate: t('common.time.today'),
            endDate: t('common.time.tomorrow'),
          }),
          closureReason: '',
        });

      await callBot('littleroot today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["rustboro"] does not return any closure if there is no closure occurring today', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed.present', {
        keyword: 'containing the keyword *rustboro* ',
        timePeriod: 'today',
      });

      await callBot('rustboro');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tmr"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.future', {
          keyword: 'containing the keyword *slateport* ',
          timePeriod: 'tomorrow',
        }) +
        t('search.item', {
          hcName: 'Slateport City',
          closurePeriod: t('common.time.tomorrow'),
          closureReason: '',
        });

      await callBot('slateport tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tomorrow"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.future', {
          keyword: 'containing the keyword *slateport* ',
          timePeriod: 'tomorrow',
        }) +
        t('search.item', {
          hcName: 'Slateport City',
          closurePeriod: t('common.time.tomorrow'),
          closureReason: '',
        });

      await callBot('slateport tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["oldale month"] returns closures occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.present', {
          keyword: 'containing the keyword *oldale* ',
          timePeriod: 'this month',
        }) +
        [
          t('search.item', {
            hcName: 'Oldale Town',
            closurePeriod: t('common.time.time-period', {
              startDate: '15\\-Jan',
              endDate: '18\\-Jan',
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            closurePeriod: t('common.time.time-period', {
              startDate: '30\\-Jan',
              endDate: '31\\-Jan',
            }),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('oldale month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville 118 month"] searches across multiple words', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.present', {
          keyword: 'containing the keyword *melville 118* ',
          timePeriod: 'this month',
        }) +
        t('search.item', {
          hcName: 'Route 118 near Melville City',
          closurePeriod: t('common.time.time-period', {
            startDate: '21\\-Jan',
            endDate: '24\\-Jan',
          }),
          closureReason: '',
        });

      await callBot('melville 118 month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["psychic month"] searches on secondary name', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.present', {
          keyword: 'containing the keyword *psychic* ',
          timePeriod: 'this month',
        }) +
        t('search.item', {
          hcName: 'Mossdeep Gym',
          closurePeriod: '05\\-Jan',
          closureReason: '',
        });

      await callBot('psychic month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["verdanturf next month"] returns closures occurring in the next month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.future', {
          keyword: 'containing the keyword *verdanturf* ',
          timePeriod: 'next month',
        }) +
        t('search.item', {
          hcName: 'Verdanturf Town',
          closurePeriod: t('common.time.time-period', {
            startDate: '08\\-Feb',
            endDate: '09\\-Feb',
          }),
          closureReason: '',
        });

      await callBot('verdanturf next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next month"] returns closures occurring in the next month with the long-term renovation works suffix', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword.future', {
          keyword: 'containing the keyword *melville* ',
          timePeriod: 'next month',
        }) +
        t('search.item', {
          hcName: 'Melville City',
          closurePeriod: t('common.time.time-period', {
            startDate: '01\\-Feb',
            endDate: '28\\-Feb',
          }),
          closureReason: ' _\\(long\\-term renovation works\\)_',
        });

      await callBot('melville next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Today"] returns all closures occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword.present', {
          numHC: 2,
          timePeriod: 'today',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            closurePeriod: t('common.time.today'),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Littleroot Town',
            closurePeriod: t('common.time.time-period', {
              startDate: t('common.time.today'),
              endDate: t('common.time.tomorrow'),
            }),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword.future', {
          numHC: 2,
          timePeriod: 'tomorrow',
        }) +
        [
          t('search.item', {
            hcName: 'Littleroot Town',
            closurePeriod: t('common.time.time-period', {
              startDate: t('common.time.today'),
              endDate: t('common.time.tomorrow'),
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            closurePeriod: t('common.time.tomorrow'),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword.future', {
          numHC: 2,
          timePeriod: 'tomorrow',
        }) +
        [
          t('search.item', {
            hcName: 'Littleroot Town',
            closurePeriod: t('common.time.time-period', {
              startDate: t('common.time.today'),
              endDate: t('common.time.tomorrow'),
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            closurePeriod: t('common.time.tomorrow'),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all closures occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword.present', {
          numHC: 7,
          timePeriod: 'this month',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            closurePeriod: t('common.time.today'),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Littleroot Town',
            closurePeriod: t('common.time.time-period', {
              startDate: t('common.time.today'),
              endDate: t('common.time.tomorrow'),
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            closurePeriod: t('common.time.tomorrow'),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Mossdeep Gym',
            closurePeriod: '05\\-Jan',
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            closurePeriod: t('common.time.time-period', {
              startDate: '15\\-Jan',
              endDate: '18\\-Jan',
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Route 118 near Melville City',
            closurePeriod: t('common.time.time-period', {
              startDate: '21\\-Jan',
              endDate: '24\\-Jan',
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            closurePeriod: t('common.time.time-period', {
              startDate: '30\\-Jan',
              endDate: '31\\-Jan',
            }),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all closures occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword.future', {
          numHC: 3,
          timePeriod: 'next month',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            closurePeriod: t('common.time.time-period', {
              startDate: '01\\-Feb',
              endDate: '28\\-Feb',
            }),
            closureReason: ' _\\(long\\-term renovation works\\)_',
          }),
          t('search.item', {
            hcName: 'Rustboro City',
            closurePeriod: t('common.time.time-period', {
              startDate: '02\\-Feb',
              endDate: '05\\-Feb',
            }),
            closureReason: '',
          }),
          t('search.item', {
            hcName: 'Verdanturf Town',
            closurePeriod: t('common.time.time-period', {
              startDate: '08\\-Feb',
              endDate: '09\\-Feb',
            }),
            closureReason: '',
          }),
        ].join('\n\n');

      await callBot('Next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('when data does not exist in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-03-01T11:30:25').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["Today"] returns no closures', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed.present', {
        keyword: '',
        timePeriod: 'today',
      });

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns no closures', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed.future', {
        keyword: '',
        timePeriod: 'tomorrow',
      });

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns no closures', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed.future', {
        keyword: '',
        timePeriod: 'tomorrow',
      });

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns no closures', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed.present', {
        keyword: '',
        timePeriod: 'this month',
      });

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

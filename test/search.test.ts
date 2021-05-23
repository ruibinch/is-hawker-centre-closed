/* eslint-disable max-len */
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import * as favouritesIndex from '../src/features/favourites/index';
import { initDictionary, t } from '../src/lang';
import * as Result from '../src/models/Result';
import { mockResults } from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Search module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let getAllResultsSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    const results = { Items: mockResults } as unknown;

    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve({ success: false }));

    getAllResultsSpy = jest
      .spyOn(Result, 'getAllResults')
      .mockImplementation(
        () =>
          Promise.resolve(results) as Promise<
            PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
          >,
      );
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
    getAllResultsSpy.mockRestore();
  });

  describe('when data exists in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["littleroot"] returns a single result occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *littleroot* ',
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'today',
        }) +
        t('search.item', {
          hcName: 'Littleroot Town',
          startDate: '01\\-Jan',
          endDate: '02\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('littleroot');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["littleroot today"] returns a single result occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *littleroot* ',
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'today',
        }) +
        t('search.item', {
          hcName: 'Littleroot Town',
          startDate: '01\\-Jan',
          endDate: '02\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('littleroot today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["rustboro"] does not return any result if there is no result occurring today', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed', {
        keywordSnippet: 'containing the keyword *rustboro* ',
        temporalVerbSnippet: 'are',
        timePeriodSnippet: 'today',
      });

      await callBot('rustboro');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tmr"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *slateport* ',
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'tomorrow',
        }) +
        t('search.item', {
          hcName: 'Slateport City',
          startDate: '02\\-Jan',
          endDate: '02\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('slateport tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tomorrow"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *slateport* ',
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'tomorrow',
        }) +
        t('search.item', {
          hcName: 'Slateport City',
          startDate: '02\\-Jan',
          endDate: '02\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('slateport tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["oldale month"] returns results occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *oldale* ',
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'this month',
        }) +
        [
          t('search.item', {
            hcName: 'Oldale Town',
            startDate: '15\\-Jan',
            endDate: '18\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            startDate: '30\\-Jan',
            endDate: '31\\-Jan',
            closureReasonSnippet: '',
          }),
        ].join('\n\n');

      await callBot('oldale month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville 118 month"] searches across multiple words', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *melville 118* ',
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'this month',
        }) +
        t('search.item', {
          hcName: 'Route 118 near Melville City',
          startDate: '21\\-Jan',
          endDate: '24\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('melville 118 month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["psychic month"] searches on secondary name', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *psychic* ',
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'this month',
        }) +
        t('search.item', {
          hcName: 'Mossdeep Gym',
          startDate: '05\\-Jan',
          endDate: '06\\-Jan',
          closureReasonSnippet: '',
        });

      await callBot('psychic month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["verdanturf next month"] returns results occurring in the next month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *verdanturf* ',
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'next month',
        }) +
        t('search.item', {
          hcName: 'Verdanturf Town',
          startDate: '08\\-Feb',
          endDate: '09\\-Feb',
          closureReasonSnippet: '',
        });

      await callBot('verdanturf next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next month"] returns results occurring in the next month with the long-term renovation works suffix', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.with-keyword', {
          keywordSnippet: 'containing the keyword *melville* ',
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'next month',
        }) +
        t('search.item', {
          hcName: 'Melville City',
          startDate: '01\\-Feb',
          endDate: '28\\-Feb',
          closureReasonSnippet: ' _\\(long\\-term renovation works\\)_',
        });

      await callBot('melville next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Today"] returns all results occurring today', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword', {
          numResultsSnippet: t('search.snippet.num-results', {
            numResults: 2,
          }),
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'today',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            startDate: '01\\-Jan',
            endDate: '01\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Littleroot Town',
            startDate: '01\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
        ].join('\n\n');

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword', {
          numResultsSnippet: t('search.snippet.num-results', {
            numResults: 2,
          }),
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'tomorrow',
        }) +
        [
          t('search.item', {
            hcName: 'Littleroot Town',
            startDate: '01\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            startDate: '02\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
        ].join('\n\n');

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns all results occurring tomorrow', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword', {
          numResultsSnippet: t('search.snippet.num-results', {
            numResults: 2,
          }),
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'tomorrow',
        }) +
        [
          t('search.item', {
            hcName: 'Littleroot Town',
            startDate: '01\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            startDate: '02\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
        ].join('\n\n');

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all results occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword', {
          numResultsSnippet: t('search.snippet.num-results', {
            numResults: 7,
          }),
          temporalVerbSnippet: 'are',
          timePeriodSnippet: 'this month',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            startDate: '01\\-Jan',
            endDate: '01\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Littleroot Town',
            startDate: '01\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Slateport City',
            startDate: '02\\-Jan',
            endDate: '02\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Mossdeep Gym',
            startDate: '05\\-Jan',
            endDate: '06\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            startDate: '15\\-Jan',
            endDate: '18\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Route 118 near Melville City',
            startDate: '21\\-Jan',
            endDate: '24\\-Jan',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Oldale Town',
            startDate: '30\\-Jan',
            endDate: '31\\-Jan',
            closureReasonSnippet: '',
          }),
        ].join('\n\n');

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all results occurring in the current month', async () => {
      const expectedMessage =
        t('search.hawker-centres-closed.without-keyword', {
          numResultsSnippet: t('search.snippet.num-results', {
            numResults: 3,
          }),
          temporalVerbSnippet: 'will be',
          timePeriodSnippet: 'next month',
        }) +
        [
          t('search.item', {
            hcName: 'Melville City',
            startDate: '01\\-Feb',
            endDate: '28\\-Feb',
            closureReasonSnippet: ' _\\(long\\-term renovation works\\)_',
          }),
          t('search.item', {
            hcName: 'Rustboro City',
            startDate: '02\\-Feb',
            endDate: '05\\-Feb',
            closureReasonSnippet: '',
          }),
          t('search.item', {
            hcName: 'Verdanturf Town',
            startDate: '08\\-Feb',
            endDate: '09\\-Feb',
            closureReasonSnippet: '',
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
        .mockImplementation(() => parseISO('2021-03-01').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["Today"] returns no results', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed', {
        keywordSnippet: '',
        temporalVerbSnippet: 'are',
        timePeriodSnippet: 'today',
      });

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns no results', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed', {
        keywordSnippet: '',
        temporalVerbSnippet: 'will be',
        timePeriodSnippet: 'tomorrow',
      });

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns no results', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed', {
        keywordSnippet: '',
        temporalVerbSnippet: 'will be',
        timePeriodSnippet: 'tomorrow',
      });

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns no results', async () => {
      const expectedMessage = t('search.no-hawker-centres-closed', {
        keywordSnippet: '',
        temporalVerbSnippet: 'are',
        timePeriodSnippet: 'this month',
      });

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns no results', async () => {
      const expectedMessage = t('search.error.next-month-data-unavailable');

      await callBot('Next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

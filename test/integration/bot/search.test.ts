/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as favouritesIndex from '../../../src/bot/services/favourites/index';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as ClosureFile from '../../../src/models/Closure';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import * as telegramMethods from '../../../src/telegram/methods';
import { mockClosures } from './__mocks__/db';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('[bot] [integration] Search module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
    maybeHandleFavouriteSelectionSpy = jest
      .spyOn(favouritesIndex, 'maybeHandleFavouriteSelection')
      .mockImplementation(() => Promise.resolve(Result.Err()));
    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockClosures)));
  });

  beforeEach(() => {
    sendMessageSpy = jest
      .spyOn(telegramMethods, 'sendMessage')
      .mockImplementation(() => Promise.resolve());
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();

    getUserByIdSpy.mockRestore();
    maybeHandleFavouriteSelectionSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
  });

  describe('when data exists in DB', () => {
    beforeEach(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01T11:30:25').valueOf());
    });

    afterEach(() => {
      dateSpy.mockRestore();
    });

    it('["littleroot"] returns the next closure dates for hawker centres relating to the keyword "littleroot" by default', async () => {
      const inputMessage = 'littleroot';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *littleroot* and their next closure dates:\n\n' +
        '1\\. *Littleroot Town*\n_today to tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["littleroot today"] returns a single closure occurring today', async () => {
      const inputMessage = 'littleroot today';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *littleroot* that are closed today:\n\n' +
        '1\\. *Littleroot Town*\n_today to tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["slateport tmr"] returns all closures occurring tomorrow', async () => {
      const inputMessage = 'slateport tmr';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *slateport* that will be closed tomorrow:\n\n' +
        '1\\. *Slateport City*\n_tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["slateport tomorrow"] returns all closures occurring tomorrow', async () => {
      const inputMessage = 'slateport tomorrow';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *slateport* that will be closed tomorrow:\n\n' +
        '1\\. *Slateport City*\n_tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["rustboro next week"] returns a single closure occurring next week, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-01-31 is a Sunday; the next week should have a date range [2021-02-01, 2021-02-07]
        .mockImplementation(() => parseISO('2021-01-31T00:00:00').valueOf());

      const inputMessage = 'rustboro next week';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *rustboro* that will be closed next week \\(01\\-Feb to 07\\-Feb\\):\n\n' +
        '1\\. *Rustboro City*\n_02\\-Feb to 05\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["oldale month"] returns closures occurring in the current month', async () => {
      const inputMessage = 'oldale month';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *oldale* that are closed this month:\n\n' +
        '1\\. *Oldale Town*\n_15\\-Jan to 18\\-Jan_\n\n' +
        '2\\. *Oldale Town*\n_30\\-Jan to 31\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["melville 118 month"] searches across multiple words', async () => {
      const inputMessage = 'melville 118 month';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *melville 118* that are closed this month:\n\n' +
        '1\\. *Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["psychic month"] searches on secondary name', async () => {
      const inputMessage = 'psychic month';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *psychic* that are closed this month:\n\n' +
        '1\\. *Mossdeep Gym \\(Psychics in space\\)*\n_05\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["verdanturf next month"] returns closures occurring in the next month', async () => {
      const inputMessage = 'verdanturf next month';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *verdanturf* that will be closed next month:\n\n' +
        '1\\. *Verdanturf Town*\n_08\\-Feb to 09\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["melville next month"] returns closures occurring in the next month with the other works suffix', async () => {
      const inputMessage = 'melville next month';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *melville* that will be closed next month:\n\n' +
        '1\\. *Melville City*\n_01\\-Feb to 28\\-Feb; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["melville next"] returns the next closure dates for hawker centres relating to the keyword "melville"', async () => {
      const inputMessage = 'melville next';
      const expectedMessage =
        'Here are the hawker centres relating to the keyword *melville* and their next closure dates:\n\n' +
        '1\\. *Melville City*\n_today_\n\n' +
        '2\\. *Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Tdy" / "Today"] returns all closures occurring today', async () => {
      const inputMessage1 = 'Tdy';
      const inputMessage2 = 'Today';
      const expectedMessage =
        'There are *3* hawker centres that are closed today:\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Littleroot Town*\n_today to tomorrow_\n\n' +
        '3\\. *Melville City*\n_today_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Tmr" / "Tomorrow"] returns all closures occurring tomorrow', async () => {
      const inputMessage1 = 'Tmr';
      const inputMessage2 = 'Tomorrow';
      const expectedMessage =
        'There are *3* hawker centres that will be closed tomorrow:\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Littleroot Town*\n_today to tomorrow_\n\n' +
        '3\\. *Slateport City*\n_tomorrow_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Week" / "This week"] returns all closures occurring in this week, when there are multiple closures', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-02-07 is a Sunday; this week should have a date range [2021-02-01, 2021-02-07]
        .mockImplementation(() => parseISO('2021-02-07T00:00:00').valueOf());

      const inputMessage1 = 'Week';
      const inputMessage2 = 'This week';
      const expectedMessage =
        'There are *3* hawker centres that are closed this week \\(01\\-Feb to 07\\-Feb\\):\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Melville City*\n_01\\-Feb to 28\\-Feb; other works_\n\n' +
        '3\\. *Rustboro City*\n_02\\-Feb to 05\\-Feb_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Week" / "This week"] returns all closures occurring in this week, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2020-12-27 is a Sunday; the next week should have a date range [2020-12-21, 2020-12-27]
        .mockImplementation(() => parseISO('2020-12-27T00:00:00').valueOf());

      const inputMessage1 = 'Week';
      const inputMessage2 = 'This week';
      const expectedMessage =
        'There is *1* hawker centre that is closed this week \\(21\\-Dec to 27\\-Dec\\):\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Next week"] returns all closures occurring in the next week, when there are multiple closures', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-01-31 is a Sunday; the next week should have a date range [2021-02-01, 2021-02-07]
        .mockImplementation(() => parseISO('2021-01-31T00:00:00').valueOf());

      const inputMessage = 'Next week';
      const expectedMessage =
        'There are *3* hawker centres that will be closed next week \\(01\\-Feb to 07\\-Feb\\):\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Melville City*\n_tomorrow to 28\\-Feb; other works_\n\n' +
        '3\\. *Rustboro City*\n_02\\-Feb to 05\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Next week"] returns all closures occurring in the next week, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2020-12-20` is a Sunday; the next week should have a date range [2020-12-21, 2020-12-27]
        .mockImplementation(() => parseISO('2020-12-20T00:00:00').valueOf());

      const inputMessage = 'Next week';
      const expectedMessage =
        'There is *1* hawker centre that will be closed next week \\(21\\-Dec to 27\\-Dec\\):\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Month"] returns all closures occurring in the current month, when there are multiple closures', async () => {
      const inputMessage = 'Month';
      const expectedMessage =
        'There are *8* hawker centres that are closed this month:\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Littleroot Town*\n_today to tomorrow_\n\n' +
        '3\\. *Melville City*\n_today_';
      const expectedReplyMarkup = {
        inline_keyboard: [
          [
            { callback_data: '$searchPagination null', text: '[ 1 ]' },
            { callback_data: '$searchPagination 2', text: '2 ›' },
            { callback_data: '$searchPagination 3', text: '3 »' },
          ],
        ],
      };

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, {
        text: expectedMessage,
        reply_markup: expectedReplyMarkup,
      });
    });

    it('["Month"] returns all closures occurring in the current month, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-06-05T00:00:00').valueOf());

      const inputMessage = 'Month';
      const expectedMessage =
        'There is *1* hawker centre that is closed this month:\n\n' +
        '1\\. *Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Next month"] returns all closures occurring in the next month, when there are multiple closures', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-03-01T00:00:00').valueOf());

      const inputMessage = 'Next month';
      const expectedMessage =
        'There are *3* hawker centres that will be closed next month:\n\n' +
        '1\\. *Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '2\\. *Lavaridge Gym*\n_01\\-Apr to 05\\-May; other works_\n\n' +
        '3\\. *Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Next month"] returns all closures occurring in the next month, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-05-15T00:00:00').valueOf());

      const inputMessage = 'Next month';
      const expectedMessage =
        'There is *1* hawker centre that will be closed next month:\n\n' +
        '1\\. *Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });
  });

  describe('when data does not exist in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2020-07-01T11:30:25').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["pallet"/"pallet next"] returns a message stating that no hawker centres exist', async () => {
      const expectedMessage =
        'There are no hawker centres relating to the keyword *pallet*\\. Please try again with another keyword\\.';

      let inputMessage = 'pallet';
      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      inputMessage = 'pallet next';
      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Next"] returns a custom message when the search keyword is a sole "next"', async () => {
      const inputMessage = 'Next';
      const expectedMessage =
        'Searching by *next* requires a preceding hawker centre search keyword, e\\.g\\. `amoy next`\\. Please try again\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Tdy / Today"] returns no closures', async () => {
      const inputMessage1 = 'Tdy';
      const inputMessage2 = 'Today';
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning today\\.';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Tmr" / "Tomorrow"] returns no closures', async () => {
      const inputMessage1 = 'Tmr';
      const inputMessage2 = 'Tomorrow';
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["Month"] returns no closures', async () => {
      const inputMessage = 'Month';
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning this month\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });
  });

  describe('error scenarios', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-01-01T11:30:25').valueOf());
      getAllClosuresSpy = jest
        .spyOn(ClosureFile, 'getAllClosures')
        .mockImplementationOnce(() =>
          Promise.resolve(Result.Err(new AWSError())),
        );
    });

    afterAll(() => {
      dateSpy.mockRestore();
      getAllClosuresSpy.mockRestore();
    });

    it('returns an unexpected error message when getAllClosures returns an error', async () => {
      const inputMessage = 'littleroot';
      const expectedMessage =
        "Woops, couldn't perform the search for some unexpected reason\\. Try again?";

      await callBot(inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

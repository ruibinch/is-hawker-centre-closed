/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as sender from '../../../src/bot/sender';
import * as favouritesIndex from '../../../src/bot/services/favourites/index';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as ClosureFile from '../../../src/models/Closure';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
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
      .spyOn(sender, 'sendMessage')
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

    it('["littleroot"] returns the next closure dates for hawker centres containing the keyword "littleroot" by default', async () => {
      const inputMessage = 'littleroot';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* and their next closure dates:\n\n' +
        '*Littleroot Town*\n_today to tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["littleroot today"] returns a single closure occurring today', async () => {
      const inputMessage = 'littleroot today';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* that are closed today:\n\n' +
        '*Littleroot Town*\n_today to tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tmr"] returns all closures occurring tomorrow', async () => {
      const inputMessage = 'slateport tmr';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n\n' +
        '*Slateport City*\n_tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tomorrow"] returns all closures occurring tomorrow', async () => {
      const inputMessage = 'slateport tomorrow';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n\n' +
        '*Slateport City*\n_tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["rustboro next week"] returns a single closure occurring next week, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-01-31 is a Sunday; the next week should have a date range [2021-02-01, 2021-02-07]
        .mockImplementation(() => parseISO('2021-01-31T00:00:00').valueOf());

      const inputMessage = 'rustboro next week';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *rustboro* that will be closed next week \\(01\\-Feb to 07\\-Feb\\):\n\n' +
        '*Rustboro City*\n_02\\-Feb to 05\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["oldale month"] returns closures occurring in the current month', async () => {
      const inputMessage = 'oldale month';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *oldale* that are closed this month:\n\n' +
        '*Oldale Town*\n_15\\-Jan to 18\\-Jan_\n\n' +
        '*Oldale Town*\n_30\\-Jan to 31\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville 118 month"] searches across multiple words', async () => {
      const inputMessage = 'melville 118 month';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville 118* that are closed this month:\n\n' +
        '*Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["psychic month"] searches on secondary name', async () => {
      const inputMessage = 'psychic month';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *psychic* that are closed this month:\n\n' +
        '*Mossdeep Gym \\(Psychics in space\\)*\n_05\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["verdanturf next month"] returns closures occurring in the next month', async () => {
      const inputMessage = 'verdanturf next month';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *verdanturf* that will be closed next month:\n\n' +
        '*Verdanturf Town*\n_08\\-Feb to 09\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next month"] returns closures occurring in the next month with the other works suffix', async () => {
      const inputMessage = 'melville next month';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville* that will be closed next month:\n\n' +
        '*Melville City*\n_01\\-Feb to 28\\-Feb; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next"] returns the next closure dates for hawker centres containing the keyword "melville"', async () => {
      const inputMessage = 'melville next';
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville* and their next closure dates:\n\n' +
        '*Melville City*\n_today_\n\n' +
        '*Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tdy" / "Today"] returns all closures occurring today', async () => {
      const inputMessage1 = 'Tdy';
      const inputMessage2 = 'Today';
      const expectedMessage =
        'There are *3* hawker centres that are closed today:\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '*Littleroot Town*\n_today to tomorrow_\n\n' +
        '*Melville City*\n_today_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, expectedMessage);

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr" / "Tomorrow"] returns all closures occurring tomorrow', async () => {
      const inputMessage1 = 'Tmr';
      const inputMessage2 = 'Tomorrow';
      const expectedMessage =
        'There are *3* hawker centres that will be closed tomorrow:\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '*Littleroot Town*\n_today to tomorrow_\n\n' +
        '*Slateport City*\n_tomorrow_';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, expectedMessage);

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next week"] returns all closures occurring in the next week, when there are multiple closures', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-01-31 is a Sunday; the next week should have a date range [2021-02-01, 2021-02-07]
        .mockImplementation(() => parseISO('2021-01-31T00:00:00').valueOf());

      const inputMessage = 'Next week';
      const expectedMessage =
        'There are *3* hawker centres that will be closed next week \\(01\\-Feb to 07\\-Feb\\):\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '*Melville City*\n_tomorrow to 28\\-Feb; other works_\n\n' +
        '*Rustboro City*\n_02\\-Feb to 05\\-Feb_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next week"] returns all closures occurring in the next week, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        // 2021-12-20` is a Sunday; the next week should have a date range [2020-12-21, 2020-12-27]
        .mockImplementation(() => parseISO('2020-12-20T00:00:00').valueOf());

      const inputMessage = 'Next week';
      const expectedMessage =
        'There is *1* hawker centre that will be closed next week \\(21\\-Dec to 27\\-Dec\\):\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all closures occurring in the current month, when there are multiple closures', async () => {
      const inputMessage = 'Month';
      const expectedMessage =
        'There are *8* hawker centres that are closed this month:\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '*Littleroot Town*\n_today to tomorrow_\n\n' +
        '*Melville City*\n_today_\n\n' +
        '*Mossdeep Gym \\(Psychics in space\\)*\n_05\\-Jan_\n\n' +
        '*Oldale Town*\n_15\\-Jan to 18\\-Jan_\n\n' +
        '*Oldale Town*\n_30\\-Jan to 31\\-Jan_\n\n' +
        '*Route 118 near Melville City*\n_21\\-Jan to 24\\-Jan_\n\n' +
        '*Slateport City*\n_tomorrow_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all closures occurring in the current month, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-06-05T00:00:00').valueOf());

      const inputMessage = 'Month';
      const expectedMessage =
        'There is *1* hawker centre that is closed this month:\n\n' +
        '*Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all closures occurring in the next month, when there are multiple closures', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-03-01T00:00:00').valueOf());

      const inputMessage = 'Next month';
      const expectedMessage =
        'There are *3* hawker centres that will be closed next month:\n\n' +
        '*Devon Corporation*\n_01\\-Nov to 30\\-Apr; other works_\n\n' +
        '*Lavaridge Gym*\n_01\\-Apr to 05\\-May; other works_\n\n' +
        '*Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all closures occurring in the next month, when there is a single closure', async () => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-05-15T00:00:00').valueOf());

      const inputMessage = 'Next month';
      const expectedMessage =
        'There is *1* hawker centre that will be closed next month:\n\n' +
        '*Petalburg Gym*\n_30\\-Mar till indefinitely; other works_';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
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
        'There are no hawker centres containing the keyword *pallet*\\. Please try again with another keyword\\.';

      let inputMessage = 'pallet';
      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);

      inputMessage = 'pallet next';
      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next"] returns a custom message when the search keyword is a sole "next"', async () => {
      const inputMessage = 'Next';
      const expectedMessage =
        'Searching by *next* requires a preceding hawker centre search keyword, e\\.g\\. `amoy next`\\. Please try again\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tdy / Today"] returns no closures', async () => {
      const inputMessage1 = 'Tdy';
      const inputMessage2 = 'Today';
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning today\\.';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, expectedMessage);

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr" / "Tomorrow"] returns no closures', async () => {
      const inputMessage1 = 'Tmr';
      const inputMessage2 = 'Tomorrow';
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot(inputMessage1);
      assertInputSaved(addInputToDBSpy, inputMessage1);
      assertBotResponse(sendMessageSpy, expectedMessage);

      await callBot(inputMessage2);
      assertInputSaved(addInputToDBSpy, inputMessage2);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns no closures', async () => {
      const inputMessage = 'Month';
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning this month\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
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

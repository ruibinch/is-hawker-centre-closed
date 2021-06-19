/* eslint-disable max-len */
import { parseISO } from 'date-fns';
import { Err, Ok } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as ClosureFile from '../src/models/Closure';
import * as UserFile from '../src/models/User';
import * as favouritesIndex from '../src/services/favourites/index';
import { mockClosures } from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Search module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let maybeHandleFavouriteSelectionSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Err(new AWSError())));

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
    getUserByIdSpy.mockRestore();
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
        'Here are the hawker centres containing the keyword *littleroot* that are closed today:\n\n' +
        '*Littleroot Town*\ntoday to tomorrow';

      await callBot('littleroot');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["littleroot today"] returns a single closure occurring today', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *littleroot* that are closed today:\n\n' +
        '*Littleroot Town*\ntoday to tomorrow';

      await callBot('littleroot today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["rustboro"] does not return any closure if there is no closure occurring today', async () => {
      const expectedMessage =
        'All good\\! No hawker centres containing the keyword *rustboro* are undergoing cleaning today\\.';

      await callBot('rustboro');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tmr"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n\n' +
        '*Slateport City*\ntomorrow';

      await callBot('slateport tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["slateport tomorrow"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *slateport* that will be closed tomorrow:\n\n' +
        '*Slateport City*\ntomorrow';

      await callBot('slateport tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["oldale month"] returns closures occurring in the current month', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *oldale* that are closed this month:\n\n' +
        '*Oldale Town*\n15\\-Jan to 18\\-Jan\n\n' +
        '*Oldale Town*\n30\\-Jan to 31\\-Jan';

      await callBot('oldale month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville 118 month"] searches across multiple words', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville 118* that are closed this month:\n\n' +
        '*Route 118 near Melville City*\n21\\-Jan to 24\\-Jan';

      await callBot('melville 118 month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["psychic month"] searches on secondary name', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *psychic* that are closed this month:\n\n' +
        '*Mossdeep Gym*\n05\\-Jan';

      await callBot('psychic month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["verdanturf next month"] returns closures occurring in the next month', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *verdanturf* that will be closed next month:\n\n' +
        '*Verdanturf Town*\n08\\-Feb to 09\\-Feb';

      await callBot('verdanturf next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["melville next month"] returns closures occurring in the next month with the other works suffix', async () => {
      const expectedMessage =
        'Here are the hawker centres containing the keyword *melville* that will be closed next month:\n\n' +
        '*Melville City*\n01\\-Feb to 28\\-Feb _\\(other works\\)_';

      await callBot('melville next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Today"] returns all closures occurring today', async () => {
      const expectedMessage =
        'There are *3* hawker centres that are closed today:\n\n' +
        '*Devon Corporation*\n01\\-Nov to 30\\-Apr _\\(other works\\)_\n\n' +
        '*Melville City*\ntoday\n\n' +
        '*Littleroot Town*\ntoday to tomorrow';

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        'There are *3* hawker centres that will be closed tomorrow:\n\n' +
        '*Devon Corporation*\n01\\-Nov to 30\\-Apr _\\(other works\\)_\n\n' +
        '*Littleroot Town*\ntoday to tomorrow\n\n' +
        '*Slateport City*\ntomorrow';

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns all closures occurring tomorrow', async () => {
      const expectedMessage =
        'There are *3* hawker centres that will be closed tomorrow:\n\n' +
        '*Devon Corporation*\n01\\-Nov to 30\\-Apr _\\(other works\\)_\n\n' +
        '*Littleroot Town*\ntoday to tomorrow\n\n' +
        '*Slateport City*\ntomorrow';

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns all closures occurring in the current month', async () => {
      const expectedMessage =
        'There are *8* hawker centres that are closed this month:\n\n' +
        '*Devon Corporation*\n01\\-Nov to 30\\-Apr _\\(other works\\)_\n\n' +
        '*Melville City*\ntoday\n\n' +
        '*Littleroot Town*\ntoday to tomorrow\n\n' +
        '*Slateport City*\ntomorrow\n\n' +
        '*Mossdeep Gym*\n05\\-Jan\n\n' +
        '*Oldale Town*\n15\\-Jan to 18\\-Jan\n\n' +
        '*Route 118 near Melville City*\n21\\-Jan to 24\\-Jan\n\n' +
        '*Oldale Town*\n30\\-Jan to 31\\-Jan';

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Next month"] returns all closures occurring in the next month', async () => {
      const expectedMessage =
        'There are *3* hawker centres that will be closed next month:\n\n' +
        '*Melville City*\n01\\-Feb to 28\\-Feb _\\(other works\\)_\n\n' +
        '*Rustboro City*\n02\\-Feb to 05\\-Feb\n\n' +
        '*Verdanturf Town*\n08\\-Feb to 09\\-Feb';

      await callBot('Next month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('when data does not exist in DB', () => {
    beforeAll(() => {
      dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => parseISO('2021-05-01T11:30:25').valueOf());
    });

    afterAll(() => {
      dateSpy.mockRestore();
    });

    it('["Today"] returns no closures', async () => {
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning today\\.';

      await callBot('Today');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tmr"] returns no closures', async () => {
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot('Tmr');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Tomorrow"] returns no closures', async () => {
      const expectedMessage =
        'All good\\! No hawker centres will be undergoing cleaning tomorrow\\.';

      await callBot('Tomorrow');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["Month"] returns no closures', async () => {
      const expectedMessage =
        'All good\\! No hawker centres are undergoing cleaning this month\\.';

      await callBot('Month');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });
});

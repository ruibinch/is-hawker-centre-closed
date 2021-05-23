/* eslint-disable max-len */
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { parseISO } from 'date-fns';

import * as sender from '../src/bot/sender';
import * as favouritesIndex from '../src/features/favourites/index';
import * as feedbackIndex from '../src/features/feedback/index';
import * as searchIndex from '../src/features/search/index';
import { initDictionary, t } from '../src/lang';
import * as HawkerCentre from '../src/models/HawkerCentre';
import * as Result from '../src/models/Result';
import * as User from '../src/models/User';
import {
  mockHawkerCentres,
  mockResults,
  mockUser,
  mockUserInFavMode,
  mockUserWithNoFavs,
  mockUserWithOneFav,
} from './__mocks__/db';
import { assertBotResponse, makeBotWrapper } from './helpers/bot';

describe('Favourites module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let sendMessageWithChoicesSpy: jest.SpyInstance;

  // dynamodb mocks
  let getAllHawkerCentresSpy: jest.SpyInstance;
  let getHawkerCentreByIdSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let updateUserFavouritesSpy: jest.SpyInstance;
  let updateUserInFavouritesModeSpy: jest.SpyInstance;
  let updateUserNotificationsSpy: jest.SpyInstance;
  let getAllResultsSpy: jest.SpyInstance;

  beforeAll(() => {
    initDictionary();

    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05').valueOf());

    const hawkerCentres = { Items: mockHawkerCentres } as unknown;
    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentre, 'getAllHawkerCentres')
      .mockImplementation(
        () =>
          Promise.resolve(hawkerCentres) as Promise<
            PromiseResult<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
          >,
      );

    const hawkerCentre = { Item: mockHawkerCentres[0] } as unknown;
    getHawkerCentreByIdSpy = jest
      .spyOn(HawkerCentre, 'getHawkerCentreById')
      .mockImplementation(
        () =>
          Promise.resolve(hawkerCentre) as Promise<
            PromiseResult<
              AWS.DynamoDB.DocumentClient.GetItemOutput,
              AWS.AWSError
            >
          >,
      );

    const user = { Item: mockUser } as unknown;
    getUserByIdSpy = jest
      .spyOn(User, 'getUserById')
      .mockImplementation(
        () =>
          Promise.resolve(user) as Promise<
            PromiseResult<
              AWS.DynamoDB.DocumentClient.GetItemOutput,
              AWS.AWSError
            >
          >,
      );

    const results = { Items: mockResults } as unknown;
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
    sendMessageWithChoicesSpy = jest
      .spyOn(sender, 'sendMessageWithChoices')
      .mockImplementation();

    updateUserFavouritesSpy = jest
      .spyOn(User, 'updateUserFavourites')
      .mockImplementation();
    updateUserInFavouritesModeSpy = jest
      .spyOn(User, 'updateUserInFavouritesMode')
      .mockImplementation();
    updateUserNotificationsSpy = jest
      .spyOn(User, 'updateUserNotifications')
      .mockImplementation();
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    sendMessageWithChoicesSpy.mockRestore();

    updateUserFavouritesSpy.mockRestore();
    updateUserInFavouritesModeSpy.mockRestore();
    updateUserNotificationsSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();

    getAllHawkerCentresSpy.mockRestore();
    getHawkerCentreByIdSpy.mockRestore();
    getUserByIdSpy.mockRestore();
    getAllResultsSpy.mockRestore();
  });

  describe('empty commands', () => {
    it('["/fav"] returns the explanatory message', async () => {
      const expectedMessage =
        t('favourites.command-fav.explanation.first') +
        t('favourites.command-fav.explanation.second', {
          example: 'bedok',
        });

      await callBot('/fav');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["/del"] returns the explanatory message', async () => {
      const expectedMessage =
        t('favourites.command-del.explanation.first') +
        t('favourites.command-del.explanation.second');

      await callBot('/del');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('searching for a favourite hawker centre', () => {
    it('["/fav oldale"] returns a single result, and sets isInFavouritesMode to true', async () => {
      const expectedMessage = t('favourites.confirm-hawker-centre');
      const expectedChoices = ['Oldale Town'];

      await callBot('/fav oldale');
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav fortree"] returns multiple choices for selection, and sets isInFavouritesMode to true', async () => {
      const expectedMessage = t('favourites.choose-favourite-hawker-centre');
      const expectedChoices = ['Fortree Market', 'Fortree Gym'];

      await callBot('/fav fortree');
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav psychic"] searches on secondary name, and sets isInFavouritesMode to true', async () => {
      const expectedMessage = t('favourites.confirm-hawker-centre');
      const expectedChoices = ['Mossdeep Gym'];

      await callBot('/fav psychic');
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav melville 118"] searches across multiple words, and sets isInFavouritesMode to true', async () => {
      const expectedMessage = t('favourites.confirm-hawker-centre');
      const expectedChoices = ['Route 118 near Melville City'];

      await callBot('/fav melville 118');
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav lilycove"] returns an error message when there are no results', async () => {
      const expectedMessage = t('favourites.error.no-results-found', {
        keywordSnippet: ' for keyword *lilycove*',
      });

      await callBot('/fav lilycove');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });

    it('["/fav gym"] returns an error message when there are too many results', async () => {
      const expectedMessage = t('favourites.error.too-many-results');

      await callBot('/fav gym');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });
  });

  describe('existing user with multiple saved favourites', () => {
    beforeAll(() => {
      const user = { Item: mockUser } as unknown;
      getUserByIdSpy = jest
        .spyOn(User, 'getUserById')
        .mockImplementation(
          () =>
            Promise.resolve(user) as Promise<
              PromiseResult<
                AWS.DynamoDB.DocumentClient.GetItemOutput,
                AWS.AWSError
              >
            >,
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] an exact match will add it to the favourites list', async () => {
        const expectedMessage = t('favourites.hawker-centre-added', {
          hcName: 'Slateport Market',
        });

        await callBot('/fav Slateport Market');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreId: 12,
              dateAdded: '2021-01-05T00:00:00Z',
            },
          ]),
        );
      });

      it('["/fav Verdanturf Town"] returns a duplicate error message when hawker centre is already in the favourites list', async () => {
        const expectedMessage = t('favourites.error.duplicate-hawker-centres', {
          hcName: 'Verdanturf Town',
        });

        await callBot('/fav Verdanturf Town');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 1"] (Littleroot Town) successfully deletes the hawker centre from the favourites list', async () => {
        const expectedMessage = t('favourites.hawker-centre-removed', {
          hcName: 'Littleroot Town',
        });

        await callBot('/del 1');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.not.arrayContaining([
            {
              hawkerCentreId: 1,
              dateAdded: '2021-01-15T17:30:52+08:00',
            },
          ]),
        );
      });

      it('["/del 0"] (invalid) returns an error message when index number is out of bounds', async () => {
        const expectedMessage =
          t('favourites.error.invalid-delete-index.first') +
          t('favourites.error.invalid-delete-index.second.multiple-favs', {
            numFavourites: 3,
          });

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del 5"] (invalid) returns an error message when index number is out of bounds', async () => {
        const expectedMessage =
          t('favourites.error.invalid-delete-index.first') +
          t('favourites.error.invalid-delete-index.second.multiple-favs', {
            numFavourites: 3,
          });

        await callBot('/del 5');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del invalidValue"] (invalid) returns an error message when index number is not a valid number', async () => {
        const expectedMessage =
          t('favourites.error.invalid-delete-index.first') +
          t('favourites.error.invalid-delete-index.second.multiple-favs', {
            numFavourites: 3,
          });

        await callBot('/del invalidValue');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] correctly returns the user\'s favourite hawker centres with results', async () => {
        const expectedMessage = t('favourites.list', {
          hcOutput: [
            t('favourites.item', {
              index: 1,
              hcName: 'Littleroot Town',
              nextClosureDetails: '',
            }),
            t('favourites.item', {
              index: 2,
              hcName: 'Verdanturf Town',
              nextClosureDetails: t('favourites.item.closure-details', {
                startDate: '08\\-Feb',
                endDate: '09\\-Feb',
              }),
            }),
            t('favourites.item', {
              index: 3,
              hcName: 'Mossdeep Gym',
              nextClosureDetails: t('favourites.item.closure-details', {
                startDate: 'today',
                endDate: 'tomorrow',
              }),
            }),
          ].join('\n'),
        });

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const expectedMessage =
          t('favourites.notifications.current', {
            currentNotificationsValue: 'on',
          }) +
          t('favourites.notifications.toggle-prompt', {
            desiredNotificationsValue: 'off',
          });

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] sets the user\'s notification setting to on', async () => {
        const expectedMessage = t('favourites.notifications.turned-on');

        await callBot('/notify on');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, true);
      });

      it('["/notify off"] sets the user\'s notification setting to off', async () => {
        const expectedMessage = t('favourites.notifications.turned-off');

        await callBot('/notify off');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, false);
      });

      it('["/notify invalidValue"] returns an error message when notification keyword is invalid', async () => {
        const expectedMessage = t(
          'favourites.notifications.unrecognised-keyword',
        );

        await callBot('/notify invalidValue');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
      });
    });
  });

  describe('existing user with one saved favourite', () => {
    beforeAll(() => {
      const user = { Item: mockUserWithOneFav } as unknown;
      getUserByIdSpy = jest
        .spyOn(User, 'getUserById')
        .mockImplementation(
          () =>
            Promise.resolve(user) as Promise<
              PromiseResult<
                AWS.DynamoDB.DocumentClient.GetItemOutput,
                AWS.AWSError
              >
            >,
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] (invalid) returns an error message stating that there is only one valid value when index number is out of bounds', async () => {
        const expectedMessage =
          t('favourites.error.invalid-delete-index.first') +
          t('favourites.error.invalid-delete-index.second.one-fav');

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('existing user with no saved favourites', () => {
    beforeAll(() => {
      const user = { Item: mockUserWithNoFavs } as unknown;
      getUserByIdSpy = jest
        .spyOn(User, 'getUserById')
        .mockImplementation(
          () =>
            Promise.resolve(user) as Promise<
              PromiseResult<
                AWS.DynamoDB.DocumentClient.GetItemOutput,
                AWS.AWSError
              >
            >,
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] returns a message prompting to add some favourites', async () => {
        const expectedMessage = t('favourites.error.no-saved-favourites');

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const expectedMessage = t('favourites.error.no-saved-favourites');

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const expectedMessage =
          t('favourites.notifications.current', {
            currentNotificationsValue: 'off',
          }) +
          t('favourites.notifications.toggle-prompt', {
            desiredNotificationsValue: 'on',
          });

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });
  });

  describe('new user', () => {
    let addUserSpy: jest.SpyInstance;

    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(User, 'getUserById')
        .mockImplementation(
          () =>
            Promise.resolve({}) as Promise<
              PromiseResult<
                AWS.DynamoDB.DocumentClient.GetItemOutput,
                AWS.AWSError
              >
            >,
        );
    });

    beforeEach(() => {
      addUserSpy = jest.spyOn(User, 'addUser').mockImplementation();
    });

    afterEach(() => {
      addUserSpy.mockRestore();
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] creates a new user with the saved favourite', async () => {
        const expectedMessage = t('favourites.hawker-centre-added', {
          hcName: 'Slateport Market',
        });

        await callBot('/fav Slateport Market');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [
            {
              hawkerCentreId: 12,
              dateAdded: '2021-01-05T00:00:00Z',
            },
          ],
          isInFavouritesMode: false,
          notifications: true,
        });
      });

      it('["/fav oldale"] returns a single result, and creates a new user with isInFavouritesMode set to true', async () => {
        const expectedMessage = t('favourites.confirm-hawker-centre');
        const expectedChoices = ['Oldale Town'];

        await callBot('/fav oldale');
        assertBotResponse(
          sendMessageWithChoicesSpy,
          expectedMessage,
          expectedChoices,
        );

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [],
          isInFavouritesMode: true,
          notifications: true,
        });
      });
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] returns a message prompting to add some favourites', async () => {
        const expectedMessage = t('favourites.error.no-saved-favourites');

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const expectedMessage = t('favourites.error.no-saved-favourites');

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns an error message when no notification setting is specified', async () => {
        const expectedMessage =
          t('favourites.notifications.not-specified.first') +
          t('favourites.notifications.not-specified.second') +
          t('favourites.notifications.not-specified.third');

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] creates a new user with notification setting set to on', async () => {
        const expectedMessage = t('favourites.notifications.turned-on');

        await callBot('/notify on');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [],
          isInFavouritesMode: false,
          notifications: true,
        });
      });

      it('["/notify off"] creates a new user with notification setting set to off', async () => {
        const expectedMessage = t('favourites.notifications.turned-off');

        await callBot('/notify off');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [],
          isInFavouritesMode: false,
          notifications: false,
        });
      });
    });
  });

  describe('user in favourites mode', () => {
    beforeAll(() => {
      const user = { Item: mockUserInFavMode } as unknown;
      getUserByIdSpy = jest
        .spyOn(User, 'getUserById')
        .mockImplementation(
          () =>
            Promise.resolve(user) as Promise<
              PromiseResult<
                AWS.DynamoDB.DocumentClient.GetItemOutput,
                AWS.AWSError
              >
            >,
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('user selects one of the displayed choices', () => {
      it('["Sootopolis Gym"] adds to the favourites list', async () => {
        const expectedMessage = t('favourites.hawker-centre-added', {
          hcName: 'Sootopolis Gym',
        });

        await callBot('Sootopolis Gym');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreId: 38,
              dateAdded: '2021-01-05T00:00:00Z',
            },
          ]),
        );
      });
    });

    describe('user ignores the choices screen and executes another flow', () => {
      let manageFavouritesSpy: jest.SpyInstance;
      let manageFeedbackSpy: jest.SpyInstance;
      let runSearchSpy: jest.SpyInstance;

      beforeEach(() => {
        manageFavouritesSpy = jest
          .spyOn(favouritesIndex, 'manageFavourites')
          .mockImplementation();
        manageFeedbackSpy = jest
          .spyOn(feedbackIndex, 'manageFeedback')
          .mockImplementation();
        runSearchSpy = jest
          .spyOn(searchIndex, 'runSearch')
          .mockImplementation();
      });

      afterEach(() => {
        manageFavouritesSpy.mockRestore();
        manageFeedbackSpy.mockRestore();
        runSearchSpy.mockRestore();
      });

      it('["sootopolis"] performs a normal search query', async () => {
        await callBot('sootopolis');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(runSearchSpy).toHaveBeenCalled();
      });

      it('["/fav lavaridge"] performs a normal /fav command', async () => {
        await callBot('/fav lavaridge');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/del 1"] performs a normal /del command', async () => {
        await callBot('/del 2');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/list"] performs a normal /list command', async () => {
        await callBot('/list');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/notify"] performs a normal /notify command', async () => {
        await callBot('/notify');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/feedback great job"] performs a normal /feedback command', async () => {
        await callBot('/feedback great job');

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFeedbackSpy).toHaveBeenCalled();
      });
    });
  });
});

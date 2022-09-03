/* eslint-disable max-len */
import { parseISO } from 'date-fns';

import * as favouritesIndex from '../../../src/bot/services/favourites/index';
import * as feedbackIndex from '../../../src/bot/services/feedback/index';
import * as searchIndex from '../../../src/bot/services/search/index';
import { AWSError } from '../../../src/errors/AWSError';
import { Result } from '../../../src/lib/Result';
import * as ClosureFile from '../../../src/models/Closure';
import * as HawkerCentreFile from '../../../src/models/HawkerCentre';
import * as InputFile from '../../../src/models/Input';
import * as UserFile from '../../../src/models/User';
import * as telegramMethods from '../../../src/telegram/methods';
import {
  mockHawkerCentres,
  mockClosures,
  mockUser,
  mockUserInFavMode,
  mockUserWithNoFavs,
  mockUserWithOneFav,
} from './__mocks__/db';
import { assertBotResponse, assertInputSaved, makeBotWrapper } from './helpers';

describe('[bot] [integration] Favourites module', () => {
  const mockCallback = jest.fn();
  const callBot = makeBotWrapper(mockCallback);

  let dateSpy: jest.SpyInstance;
  let sendMessageSpy: jest.SpyInstance;
  let sendMessageWithChoicesSpy: jest.SpyInstance;

  // dynamodb mocks
  let getAllHawkerCentresSpy: jest.SpyInstance;
  let getHawkerCentreByNameSpy: jest.SpyInstance;
  let getUserByIdSpy: jest.SpyInstance;
  let updateUserFavouritesSpy: jest.SpyInstance;
  let updateUserInFavouritesModeSpy: jest.SpyInstance;
  let updateUserNotificationsSpy: jest.SpyInstance;
  let getAllClosuresSpy: jest.SpyInstance;
  let addInputToDBSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05T11:30:25').valueOf());

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockUser)));
  });

  beforeEach(() => {
    sendMessageSpy = jest
      .spyOn(telegramMethods, 'sendMessage')
      .mockImplementation(() => Promise.resolve());
    sendMessageWithChoicesSpy = jest
      .spyOn(telegramMethods, 'sendMessageWithChoices')
      .mockImplementation();
    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockHawkerCentres)));
    getHawkerCentreByNameSpy = jest
      .spyOn(HawkerCentreFile, 'getHawkerCentreByName')
      .mockImplementation(() =>
        Promise.resolve(Result.Ok(mockHawkerCentres[0])),
      );
    updateUserFavouritesSpy = jest
      .spyOn(UserFile, 'updateUserFavourites')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
    updateUserInFavouritesModeSpy = jest
      .spyOn(UserFile, 'updateUserInFavouritesMode')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
    updateUserNotificationsSpy = jest
      .spyOn(UserFile, 'updateUserNotifications')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Result.Ok(mockClosures)));
    addInputToDBSpy = jest
      .spyOn(InputFile, 'addInputToDB')
      .mockImplementation(() => Promise.resolve(Result.Ok()));
  });

  afterEach(() => {
    sendMessageSpy.mockRestore();
    sendMessageWithChoicesSpy.mockRestore();

    getAllHawkerCentresSpy.mockRestore();
    getHawkerCentreByNameSpy.mockRestore();
    updateUserFavouritesSpy.mockRestore();
    updateUserInFavouritesModeSpy.mockRestore();
    updateUserNotificationsSpy.mockRestore();
    getAllClosuresSpy.mockRestore();
    addInputToDBSpy.mockRestore();
  });

  afterAll(() => {
    mockCallback.mockRestore();
    dateSpy.mockRestore();

    getUserByIdSpy.mockRestore();
  });

  describe('empty commands', () => {
    it('["/fav"] returns the explanatory message', async () => {
      const inputMessage = '/fav';
      const expectedMessage =
        'Please specify some keyword to filter the list of hawker centres for you to add to your favourites\\.\n\n' +
        'e\\.g\\. `/fav toa payoh`';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });

    it('["/del"] returns the explanatory message', async () => {
      const inputMessage = '/del';
      const expectedMessage =
        'To delete a favourite hawker centre, specify an index number based on the favourites list displayed by the `/list` command\\.\n\n' +
        'e\\.g\\. `/del 3`';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, { text: expectedMessage });
    });
  });

  describe('searching for a favourite hawker centre', () => {
    it('["/fav oldale"] returns a single result, and sets isInFavouritesMode to true', async () => {
      const inputMessage = '/fav oldale';
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
      const expectedChoices = ['Oldale Town'];

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav fortree"] returns multiple choices for selection, and sets isInFavouritesMode to true', async () => {
      const inputMessage = '/fav fortree';
      const expectedMessage = 'Choose your favourite hawker centre:';
      const expectedChoices = [
        'Fortree Market',
        'Fortree Gym (Treehouse living)',
      ];

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav psychic"] searches on secondary name, and sets isInFavouritesMode to true', async () => {
      const inputMessage = '/fav psychic';
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
      const expectedChoices = ['Mossdeep Gym (Psychics in space)'];

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav melville 118"] searches across multiple words, and sets isInFavouritesMode to true', async () => {
      const inputMessage = '/fav melville 118';
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
      const expectedChoices = ['Route 118 near Melville City'];

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(
        sendMessageWithChoicesSpy,
        expectedMessage,
        expectedChoices,
      );

      expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, true);
    });

    it('["/fav lilycove"] returns an error message when there are no results', async () => {
      const inputMessage = '/fav lilycove';
      const expectedMessage =
        'No results found for keyword *lilycove*\\. Try again?';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });

    it('["/fav gym"] returns an error message when there are too many results', async () => {
      const inputMessage = '/fav gym';
      const expectedMessage =
        'Too many results to be displayed, please further refine your search\\.';

      await callBot(inputMessage);
      assertInputSaved(addInputToDBSpy, inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });

    it('[error] returns an unexpected error message when attempting to add a favourite, but getAllHawkerCentres returns an error', async () => {
      getAllHawkerCentresSpy = jest
        .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
        .mockImplementationOnce(() =>
          Promise.resolve(Result.Err(new AWSError())),
        );

      const inputMessage = '/fav oldale';
      const expectedMessage =
        "Woops, couldn't add your entry for some unexpected reason\\. Try again?";

      await callBot(inputMessage);
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('existing user with multiple saved favourites', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Result.Ok(mockUser)));
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] an exact match will add it to the favourites list', async () => {
        const inputMessage = '/fav Slateport Market';
        const expectedMessage =
          'Great, adding *Slateport Market* to your list of favourites\\!';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreName: 'Slateport Market',
              dateAdded: '2021-01-05T11:30:25Z',
            },
          ]),
        );
      });

      it('["/fav Verdanturf Town"] returns a duplicate error message when hawker centre is already in the favourites list', async () => {
        const inputMessage = '/fav Verdanturf Town';
        const expectedMessage =
          '*Verdanturf Town* is already in your favourites list\\!';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('[error] returns an unexpected error message when an exact match is found, but updateUserFavourites returns an error', async () => {
        updateUserInFavouritesModeSpy = jest
          .spyOn(UserFile, 'updateUserFavourites')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/fav Slateport Market';
        const expectedMessage =
          "Woops, couldn't add your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('[error] returns an unexpected error message when a result is found, and toggling isInFavouritesMode is attempted, but updateUserInFavouritesMode returns an error', async () => {
        updateUserInFavouritesModeSpy = jest
          .spyOn(UserFile, 'updateUserInFavouritesMode')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/fav oldale';
        const expectedMessage =
          "Woops, couldn't add your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 1"] (Littleroot Town) successfully deletes the hawker centre from the favourites list', async () => {
        const inputMessage = '/del 1';
        const expectedMessage =
          '*Littleroot Town* has been deleted from your list of favourites\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.not.arrayContaining([
            {
              hawkerCentreName: 'Littleroot Town',
              dateAdded: '2021-01-15T17:30:52+08:00',
            },
          ]),
        );
      });

      it('["/del 0"] (invalid) returns an error message when index number is out of bounds', async () => {
        const inputMessage = '/del 0';
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del 5"] (invalid) returns an error message when index number is out of bounds', async () => {
        const inputMessage = '/del 5';
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del invalidValue"] (invalid) returns an error message when index number is not a valid number', async () => {
        const inputMessage = '/del invalidValue';
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('[error] returns an unexpected error message when attempting to delete a saved hawker centre, but getHawkerCentreByName returns an error', async () => {
        getHawkerCentreByNameSpy = jest
          .spyOn(HawkerCentreFile, 'getHawkerCentreByName')
          .mockImplementation(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/del 1';
        const expectedMessage =
          "Woops, couldn't delete your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('[error] returns an unexpected error message when attempting to delete a saved hawker centre, but updateUserFavourites returns an error', async () => {
        updateUserInFavouritesModeSpy = jest
          .spyOn(UserFile, 'updateUserFavourites')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/del 1';
        const expectedMessage =
          "Woops, couldn't delete your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] correctly returns the user\'s favourite hawker centres with results', async () => {
        const inputMessage = '/list';
        const expectedMessage =
          'Your favourite hawker centres and their next closure dates are:\n\n' +
          '1\\. *Littleroot Town*\n\n' +
          '2\\. *Verdanturf Town*\n    _08\\-Feb to 09\\-Feb_\n\n' +
          '3\\. *Mossdeep Gym \\(Psychics in space\\)*\n    _today_';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('[error] returns an unexpected error message when attempting to display the favourites list, but getAllClosures returns an error', async () => {
        getAllClosuresSpy = jest
          .spyOn(ClosureFile, 'getAllClosures')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/list';
        const expectedMessage =
          "Woops, couldn't display your favourites list for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('[error] returns an unexpected error message when attempting to display the favourites list, but getAllHawkerCentres returns an error', async () => {
        getAllHawkerCentresSpy = jest
          .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/list';
        const expectedMessage =
          "Woops, couldn't display your favourites list for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const inputMessage = '/notify';
        const expectedMessage =
          'Your notification setting is currently on\\.\n\n' +
          'To turn it off, type in "`/notify off`"\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] sets the user\'s notification setting to on', async () => {
        const inputMessage = '/notify on';
        const expectedMessage = 'Notifications are now *on*\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, true);
      });

      it('["/notify off"] sets the user\'s notification setting to off', async () => {
        const inputMessage = '/notify off';
        const expectedMessage = 'Notifications are now *off*\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, false);
      });

      it('["/notify invalidValue"] returns an error message when notification keyword is invalid', async () => {
        const inputMessage = '/notify invalidValue';
        const expectedMessage =
          'Invalid toggle keyword\\.\nPlease try again with either _on_ or _off_\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
      });
    });
  });

  describe('existing user with one saved favourite', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok(mockUserWithOneFav)),
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] (invalid) returns an error message stating that there is only one valid value when index number is out of bounds', async () => {
        const inputMessage = '/del 0';
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'The only valid value is 1\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('existing user with no saved favourites', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok(mockUserWithNoFavs)),
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] returns a message prompting to add some favourites', async () => {
        const inputMessage = '/list';
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the `/fav` command\\.";

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const inputMessage = '/del 0';
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the `/fav` command\\.";

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const inputMessage = '/notify';
        const expectedMessage =
          'Your notification setting is currently off\\.\n\n' +
          'To turn it on, type in "`/notify on`"\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });
  });

  describe('new user', () => {
    let addUserSpy: jest.SpyInstance;

    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Result.Err(new AWSError())));
    });

    beforeEach(() => {
      addUserSpy = jest
        .spyOn(UserFile, 'addUser')
        .mockImplementation(() => Promise.resolve(Result.Ok()));
    });

    afterEach(() => {
      addUserSpy.mockRestore();
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] creates a new user with the saved favourite', async () => {
        const inputMessage = '/fav Slateport Market';
        const expectedMessage =
          'Great, adding *Slateport Market* to your list of favourites\\!';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [
            {
              hawkerCentreName: 'Slateport Market',
              dateAdded: '2021-01-05T11:30:25Z',
            },
          ],
          isInFavouritesMode: false,
          notifications: true,
          createdAt: '2021-01-05T11:30:25Z',
        });
      });

      it('["/fav oldale"] returns a single result, and creates a new user with isInFavouritesMode set to true', async () => {
        const inputMessage = '/fav oldale';
        const expectedMessage =
          'Confirm that this is the hawker centre to be added?';
        const expectedChoices = ['Oldale Town'];

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
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
          createdAt: '2021-01-05T11:30:25Z',
        });
      });

      it('[error] returns an unexpected error message when an exact match is found, and user creation with the match in the favourites list is attempted, but addUser returns an error', async () => {
        addUserSpy = jest
          .spyOn(UserFile, 'addUser')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/fav Slateport Market';
        const expectedMessage =
          "Woops, couldn't add your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('[error] returns an unexpected error message when a result is found, and user creation with isInFavouritesMode set to true is attempted, but addUser returns an error', async () => {
        addUserSpy = jest
          .spyOn(UserFile, 'addUser')
          .mockImplementationOnce(() =>
            Promise.resolve(Result.Err(new AWSError())),
          );

        const inputMessage = '/fav oldale';
        const expectedMessage =
          "Woops, couldn't add your entry for some unexpected reason\\. Try again?";

        await callBot(inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] returns a message prompting to add some favourites', async () => {
        const inputMessage = '/list';
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the `/fav` command\\.";

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const inputMessage = '/del 0';
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the `/fav` command\\.";

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns an error message when no notification setting is specified', async () => {
        const inputMessage = '/notify';
        const expectedMessage =
          'You currently do not have a notification setting specified\\.\n\n' +
          'To toggle your notification setting, specify either the _on_ or _off_ keyword\\.\n' +
          'e\\.g\\. `/notify on`';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] creates a new user with notification setting set to on', async () => {
        const inputMessage = '/notify on';
        const expectedMessage = 'Notifications are now *on*\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [],
          isInFavouritesMode: false,
          notifications: true,
          createdAt: '2021-01-05T11:30:25Z',
        });
      });

      it('["/notify off"] creates a new user with notification setting set to off', async () => {
        const inputMessage = '/notify off';
        const expectedMessage = 'Notifications are now *off*\\.';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
        expect(addUserSpy).toHaveBeenCalledWith({
          userId: 1,
          username: 'ashketchum',
          languageCode: 'en',
          favourites: [],
          isInFavouritesMode: false,
          notifications: false,
          createdAt: '2021-01-05T11:30:25Z',
        });
      });
    });
  });

  describe('user in favourites mode', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() =>
          Promise.resolve(Result.Ok(mockUserInFavMode)),
        );
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('user selects one of the displayed choices', () => {
      it('["Sootopolis Gym"] adds to the favourites list', async () => {
        const inputMessage = 'Sootopolis Gym';
        const expectedMessage =
          'Great, adding *Sootopolis Gym* to your list of favourites\\!';

        await callBot(inputMessage);
        assertInputSaved(addInputToDBSpy, inputMessage);
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreName: 'Sootopolis Gym',
              dateAdded: '2021-01-05T11:30:25Z',
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
        const inputMessage = 'sootopolis';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(runSearchSpy).toHaveBeenCalled();
      });

      it('["/fav lavaridge"] performs a normal /fav command', async () => {
        const inputMessage = '/fav lavaridge';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/del 1"] performs a normal /del command', async () => {
        const inputMessage = '/del 2';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/list"] performs a normal /list command', async () => {
        const inputMessage = '/list';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/notify"] performs a normal /notify command', async () => {
        const inputMessage = '/notify';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFavouritesSpy).toHaveBeenCalled();
      });

      it('["/feedback great job"] performs a normal /feedback command', async () => {
        const inputMessage = '/feedback great job';
        await callBot(inputMessage);

        assertInputSaved(addInputToDBSpy, inputMessage);
        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(manageFeedbackSpy).toHaveBeenCalled();
      });
    });
  });
});

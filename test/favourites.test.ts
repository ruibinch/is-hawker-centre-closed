/* eslint-disable max-len */
import { parseISO } from 'date-fns';
import { Err, Ok } from 'ts-results';

import * as sender from '../src/bot/sender';
import { AWSError } from '../src/errors/AWSError';
import * as ClosureFile from '../src/models/Closure';
import * as HawkerCentreFile from '../src/models/HawkerCentre';
import * as UserFile from '../src/models/User';
import * as favouritesIndex from '../src/services/favourites/index';
import * as feedbackIndex from '../src/services/feedback/index';
import * as searchIndex from '../src/services/search/index';
import {
  mockHawkerCentres,
  mockClosures,
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
  let getAllClosuresSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => parseISO('2021-01-05T11:30:25').valueOf());

    getAllHawkerCentresSpy = jest
      .spyOn(HawkerCentreFile, 'getAllHawkerCentres')
      .mockImplementation(() => Promise.resolve(Ok(mockHawkerCentres)));

    getHawkerCentreByIdSpy = jest
      .spyOn(HawkerCentreFile, 'getHawkerCentreById')
      .mockImplementation(() => Promise.resolve(Ok(mockHawkerCentres[0])));

    getUserByIdSpy = jest
      .spyOn(UserFile, 'getUserById')
      .mockImplementation(() => Promise.resolve(Ok(mockUser)));

    getAllClosuresSpy = jest
      .spyOn(ClosureFile, 'getAllClosures')
      .mockImplementation(() => Promise.resolve(Ok(mockClosures)));
  });

  beforeEach(() => {
    sendMessageSpy = jest.spyOn(sender, 'sendMessage').mockImplementation();
    sendMessageWithChoicesSpy = jest
      .spyOn(sender, 'sendMessageWithChoices')
      .mockImplementation();

    updateUserFavouritesSpy = jest
      .spyOn(UserFile, 'updateUserFavourites')
      .mockImplementation(() => Promise.resolve());
    updateUserInFavouritesModeSpy = jest
      .spyOn(UserFile, 'updateUserInFavouritesMode')
      .mockImplementation(() => Promise.resolve());
    updateUserNotificationsSpy = jest
      .spyOn(UserFile, 'updateUserNotifications')
      .mockImplementation(() => Promise.resolve());
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
    getAllClosuresSpy.mockRestore();
  });

  describe('empty commands', () => {
    it('["/fav"] returns the explanatory message', async () => {
      const expectedMessage =
        'Please specify some keyword to filter the list of hawker centres for you to add to your favourites\\.\n\n' +
        'e\\.g\\. _/fav bedok_';

      await callBot('/fav');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });

    it('["/del"] returns the explanatory message', async () => {
      const expectedMessage =
        'To delete a favourite hawker centre, specify an index number based on the favourites list displayed by the /list command\\.\n\n' +
        'e\\.g\\. _/del 3_';

      await callBot('/del');
      assertBotResponse(sendMessageSpy, expectedMessage);
    });
  });

  describe('searching for a favourite hawker centre', () => {
    it('["/fav oldale"] returns a single result, and sets isInFavouritesMode to true', async () => {
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
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
      const expectedMessage = 'Choose your favourite hawker centre:';
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
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
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
      const expectedMessage =
        'Confirm that this is the hawker centre to be added?';
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
      const expectedMessage =
        'No results found for keyword *lilycove*\\. Try again?';

      await callBot('/fav lilycove');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });

    it('["/fav gym"] returns an error message when there are too many results', async () => {
      const expectedMessage =
        'Too many results to be displayed, please further refine your search\\.';

      await callBot('/fav gym');
      assertBotResponse(sendMessageSpy, expectedMessage);

      expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
    });
  });

  describe('existing user with multiple saved favourites', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Ok(mockUser)));
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] an exact match will add it to the favourites list', async () => {
        const expectedMessage =
          'Great, adding *Slateport Market* to your list of favourites\\!';

        await callBot('/fav Slateport Market');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreId: 12,
              dateAdded: '2021-01-05T11:30:25Z',
            },
          ]),
        );
      });

      it('["/fav Verdanturf Town"] returns a duplicate error message when hawker centre is already in the favourites list', async () => {
        const expectedMessage =
          '*Verdanturf Town* is already in your favourites list\\!';

        await callBot('/fav Verdanturf Town');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).not.toHaveBeenCalled();
        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 1"] (Littleroot Town) successfully deletes the hawker centre from the favourites list', async () => {
        const expectedMessage =
          '*Littleroot Town* has been deleted from your list of favourites\\.';

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
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del 5"] (invalid) returns an error message when index number is out of bounds', async () => {
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot('/del 5');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });

      it('["/del invalidValue"] (invalid) returns an error message when index number is not a valid number', async () => {
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'Try again with a value from 1 to 3\\.';

        await callBot('/del invalidValue');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] correctly returns the user\'s favourite hawker centres with results', async () => {
        const expectedMessage =
          'Your favourite hawker centres and their next closure dates are:\n\n' +
          '1\\. *Littleroot Town*\n' +
          '2\\. *Verdanturf Town*\n' +
          '    _\\(08\\-Feb to 09\\-Feb\\)_\n' +
          '3\\. *Mossdeep Gym*\n' +
          '    _\\(today\\)_';

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const expectedMessage =
          'Your notification setting is currently on\\.\n\n' +
          'To turn it off, type in "_/notify off_"\\.';

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] sets the user\'s notification setting to on', async () => {
        const expectedMessage = 'Notifications are now *on*\\.';

        await callBot('/notify on');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, true);
      });

      it('["/notify off"] sets the user\'s notification setting to off', async () => {
        const expectedMessage = 'Notifications are now *off*\\.';

        await callBot('/notify off');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).toHaveBeenCalledWith(1, false);
      });

      it('["/notify invalidValue"] returns an error message when notification keyword is invalid', async () => {
        const expectedMessage =
          'Invalid toggle keyword\\.\nPlease try again with either _on_ or _off_\\.';

        await callBot('/notify invalidValue');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserNotificationsSpy).not.toHaveBeenCalledWith();
      });
    });
  });

  describe('existing user with one saved favourite', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Ok(mockUserWithOneFav)));
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] (invalid) returns an error message stating that there is only one valid value when index number is out of bounds', async () => {
        const expectedMessage =
          'That is not a valid index number\\. ' +
          'The only valid value is 1\\.';

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('existing user with no saved favourites', () => {
    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Ok(mockUserWithNoFavs)));
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe("getting list of user's favourites", () => {
      it('["/list"] returns a message prompting to add some favourites', async () => {
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the /fav command\\.";

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the /fav command\\.";

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing the notification setting', () => {
      it('["/notify"] returns the user\'s current notification setting', async () => {
        const expectedMessage =
          'Your notification setting is currently off\\.\n\n' +
          'To turn it on, type in "_/notify on_"\\.';

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });
  });

  describe('new user', () => {
    let addUserSpy: jest.SpyInstance;

    beforeAll(() => {
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Err(new AWSError())));
    });

    beforeEach(() => {
      addUserSpy = jest
        .spyOn(UserFile, 'addUser')
        .mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      addUserSpy.mockRestore();
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('adding a favourite hawker centre', () => {
      it('["/fav Slateport Market"] creates a new user with the saved favourite', async () => {
        const expectedMessage =
          'Great, adding *Slateport Market* to your list of favourites\\!';

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
              dateAdded: '2021-01-05T11:30:25Z',
            },
          ],
          isInFavouritesMode: false,
          notifications: true,
        });
      });

      it('["/fav oldale"] returns a single result, and creates a new user with isInFavouritesMode set to true', async () => {
        const expectedMessage =
          'Confirm that this is the hawker centre to be added?';
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
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the /fav command\\.";

        await callBot('/list');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });
    });

    describe('deleting a favourite hawker centre', () => {
      it('["/del 0"] returns a message prompting to add some favourites', async () => {
        const expectedMessage =
          "You've not added any favourites yet\\. Try adding some using the /fav command\\.";

        await callBot('/del 0');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserFavouritesSpy).not.toHaveBeenCalled();
      });
    });

    describe('viewing/toggling the notification setting', () => {
      it('["/notify"] returns an error message when no notification setting is specified', async () => {
        const expectedMessage =
          'You currently do not have a notification setting specified\\.\n\n' +
          'To toggle your notification setting, specify either the _on_ or _off_ keyword\\.\n' +
          'e\\.g\\. _/notify on_';

        await callBot('/notify');
        assertBotResponse(sendMessageSpy, expectedMessage);
      });

      it('["/notify on"] creates a new user with notification setting set to on', async () => {
        const expectedMessage = 'Notifications are now *on*\\.';

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
        const expectedMessage = 'Notifications are now *off*\\.';

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
      getUserByIdSpy = jest
        .spyOn(UserFile, 'getUserById')
        .mockImplementation(() => Promise.resolve(Ok(mockUserInFavMode)));
    });

    afterAll(() => {
      getUserByIdSpy.mockRestore();
    });

    describe('user selects one of the displayed choices', () => {
      it('["Sootopolis Gym"] adds to the favourites list', async () => {
        const expectedMessage =
          'Great, adding *Sootopolis Gym* to your list of favourites\\!';

        await callBot('Sootopolis Gym');
        assertBotResponse(sendMessageSpy, expectedMessage);

        expect(updateUserInFavouritesModeSpy).toHaveBeenCalledWith(1, false);
        expect(updateUserFavouritesSpy).toHaveBeenCalledWith(
          1,
          expect.arrayContaining([
            {
              hawkerCentreId: 38,
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

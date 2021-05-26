import {
  ClosureReason,
  HawkerCentreInfo,
  Result,
  User,
} from '../../src/models/types';
import { TelegramUser } from '../../src/utils/telegram';

export const mockResults: Result[] = [
  {
    id: '111',
    hawkerCentreId: 1,
    reason: ClosureReason.cleaning,
    name: 'Littleroot Town',
    startDate: '2021-01-01',
    endDate: '2021-01-02',
  },
  {
    id: '111',
    hawkerCentreId: 5,
    reason: ClosureReason.cleaning,
    name: 'Melville City',
    startDate: '2021-01-01',
    endDate: '2021-01-01',
  },
  {
    id: '111',
    hawkerCentreId: 4,
    reason: ClosureReason.cleaning,
    name: 'Slateport City',
    startDate: '2021-01-02',
    endDate: '2021-01-02',
  },
  {
    id: '111',
    hawkerCentreId: 37,
    reason: ClosureReason.cleaning,
    name: 'Mossdeep Gym',
    nameSecondary: 'Psychics in space',
    startDate: '2021-01-05',
    endDate: '2021-01-06',
  },
  {
    id: '111',
    hawkerCentreId: 2,
    reason: ClosureReason.cleaning,
    name: 'Oldale Town',
    startDate: '2021-01-15',
    endDate: '2021-01-18',
  },
  {
    id: '111',
    hawkerCentreId: 7,
    reason: ClosureReason.cleaning,
    name: 'Route 118 near Melville City',
    startDate: '2021-01-21',
    endDate: '2021-01-24',
  },
  {
    id: '111',
    hawkerCentreId: 2,
    reason: ClosureReason.cleaning,
    name: 'Oldale Town',
    startDate: '2021-01-30',
    endDate: '2021-01-31',
  },
  {
    id: '111',
    hawkerCentreId: 3,
    reason: ClosureReason.cleaning,
    name: 'Rustboro City',
    startDate: '2021-02-02',
    endDate: '2021-02-05',
  },
  {
    id: '111',
    hawkerCentreId: 6,
    reason: ClosureReason.cleaning,
    name: 'Verdanturf Town',
    startDate: '2021-02-08',
    endDate: '2021-02-09',
  },
  {
    id: '111',
    hawkerCentreId: 5,
    reason: ClosureReason.renovation,
    name: 'Melville City',
    startDate: '2021-02-01',
    endDate: '2021-02-28',
  },
];

export const mockHawkerCentres: HawkerCentreInfo[] = [
  {
    hawkerCentreId: 1,
    name: 'Littleroot Town',
  },
  {
    hawkerCentreId: 2,
    name: 'Oldale Town',
  },
  {
    hawkerCentreId: 3,
    name: 'Rustboro City',
  },
  {
    hawkerCentreId: 4,
    name: 'Slateport City',
  },
  {
    hawkerCentreId: 5,
    name: 'Melville City',
  },
  {
    hawkerCentreId: 6,
    name: 'Verdanturf Town',
  },
  {
    hawkerCentreId: 7,
    name: 'Route 118 near Melville City',
  },
  {
    hawkerCentreId: 11,
    name: 'Devon Corporation',
  },
  {
    hawkerCentreId: 12,
    name: 'Slateport Market',
  },
  {
    hawkerCentreId: 13,
    name: 'Fortree Market',
  },
  {
    hawkerCentreId: 31,
    name: 'Rustboro Gym',
    nameSecondary: 'Rocky road ahead',
  },
  {
    hawkerCentreId: 32,
    name: 'Dewford Gym',
    nameSecondary: "Surfer's Paradise",
  },
  {
    hawkerCentreId: 33,
    name: 'Mauville Gym',
    nameSecondary: "Nikola Tesla's descendants",
  },
  {
    hawkerCentreId: 34,
    name: 'Lavaridge Gym',
    nameSecondary: 'Land of hot springs',
  },
  {
    hawkerCentreId: 35,
    name: 'Petalburg Gym',
    nameSecondary: 'Slaking the king',
  },
  {
    hawkerCentreId: 36,
    name: 'Fortree Gym',
    nameSecondary: 'Treehouse living',
  },
  {
    hawkerCentreId: 37,
    name: 'Mossdeep Gym',
    nameSecondary: 'Psychics in space',
  },
  {
    hawkerCentreId: 38,
    name: 'Sootopolis Gym',
    nameSecondary: 'A town in a crater',
  },
  {
    hawkerCentreId: 39,
    name: 'Sidney Gym',
    nameSecondary: 'Mightyena used Intimidate',
  },
  {
    hawkerCentreId: 40,
    name: 'Phoebe Gym',
    nameSecondary: 'Ghostly figures',
  },
  {
    hawkerCentreId: 41,
    name: 'Glacia Gym',
    nameSecondary: 'Ice cream heaven',
  },
  {
    hawkerCentreId: 42,
    name: 'Drake Gym',
    nameSecondary: 'How to train a dragon',
  },
  {
    hawkerCentreId: 43,
    name: 'Champion Gym',
    nameSecondary: 'Where the very best belong',
  },
];

export const mockUser: User = {
  userId: 1,
  username: 'ashketchum',
  languageCode: 'en',
  favourites: [
    {
      hawkerCentreId: 1,
      dateAdded: '2021-01-15T17:30:52+08:00',
    },
    {
      hawkerCentreId: 6,
      dateAdded: '2021-01-10T08:22:20+08:00',
    },
    {
      hawkerCentreId: 37,
      dateAdded: '2021-01-01T15:00:00+08:00',
    },
  ],
  isInFavouritesMode: false,
  notifications: true,
};

export const mockUserWithOneFav: User = {
  userId: 2,
  username: 'misty',
  languageCode: 'en',
  favourites: [
    {
      hawkerCentreId: 6,
      dateAdded: '2021-01-15T17:30:52+08:00',
    },
  ],
  isInFavouritesMode: false,
  notifications: true,
};

export const mockUserWithNoFavs: User = {
  userId: 3,
  username: 'brock',
  languageCode: 'en',
  favourites: [],
  isInFavouritesMode: false,
  notifications: false,
};

export const mockUserInFavMode: User = {
  userId: 4,
  username: 'nursejoy',
  languageCode: 'en',
  favourites: [],
  isInFavouritesMode: true,
  notifications: true,
};

export const mockUsers: User[] = [
  mockUser,
  {
    userId: 5,
    username: 'meowth',
    languageCode: 'en',
    favourites: [
      {
        hawkerCentreId: 5,
        dateAdded: '2021-01-08T09:05:12+08:00',
      },
    ],
    isInFavouritesMode: false,
    notifications: true,
  },
];

export const mockTelegramUser: TelegramUser = {
  id: 1,
  is_bot: false,
  first_name: 'Ash',
  last_name: 'Ketchum',
  username: 'ashketchum',
  language_code: 'en',
};

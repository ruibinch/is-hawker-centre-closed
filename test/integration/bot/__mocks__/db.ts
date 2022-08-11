import type { Closure } from '../../../../src/models/Closure';
import type { HawkerCentre } from '../../../../src/models/HawkerCentre';
import { Input } from '../../../../src/models/Input';
import type { User } from '../../../../src/models/User';
import type { TelegramUser } from '../../../../src/telegram';

export const mockClosures: Closure[] = [
  {
    id: '111',
    hawkerCentreId: 1,
    reason: 'cleaning',
    name: 'Littleroot Town',
    startDate: '2021-01-01',
    endDate: '2021-01-02',
  },
  {
    id: '111',
    hawkerCentreId: 5,
    reason: 'cleaning',
    name: 'Melville City',
    startDate: '2021-01-01',
    endDate: '2021-01-01',
  },
  {
    id: '111',
    hawkerCentreId: 4,
    reason: 'cleaning',
    name: 'Slateport City',
    startDate: '2021-01-02',
    endDate: '2021-01-02',
  },
  {
    id: '111',
    hawkerCentreId: 37,
    reason: 'cleaning',
    name: 'Mossdeep Gym',
    nameSecondary: 'Psychics in space',
    startDate: '2021-01-05',
    endDate: '2021-01-05',
  },
  {
    id: '111',
    hawkerCentreId: 2,
    reason: 'cleaning',
    name: 'Oldale Town',
    startDate: '2021-01-15',
    endDate: '2021-01-18',
  },
  {
    id: '111',
    hawkerCentreId: 7,
    reason: 'cleaning',
    name: 'Route 118 near Melville City',
    startDate: '2021-01-21',
    endDate: '2021-01-24',
  },
  {
    id: '111',
    hawkerCentreId: 2,
    reason: 'cleaning',
    name: 'Oldale Town',
    startDate: '2021-01-30',
    endDate: '2021-01-31',
  },
  {
    id: '111',
    hawkerCentreId: 3,
    reason: 'cleaning',
    name: 'Rustboro City',
    startDate: '2021-02-02',
    endDate: '2021-02-05',
  },
  {
    id: '111',
    hawkerCentreId: 6,
    reason: 'cleaning',
    name: 'Verdanturf Town',
    startDate: '2021-02-08',
    endDate: '2021-02-09',
  },
  {
    id: '111',
    hawkerCentreId: 5,
    reason: 'others',
    name: 'Melville City',
    startDate: '2021-02-01',
    endDate: '2021-02-28',
  },
  {
    id: '111',
    hawkerCentreId: 11,
    reason: 'others',
    name: 'Devon Corporation',
    startDate: '2020-11-01',
    endDate: '2021-04-30',
  },
  {
    id: '111',
    hawkerCentreId: 34,
    reason: 'others',
    name: 'Lavaridge Gym',
    startDate: '2021-04-01',
    endDate: '2021-05-05',
  },
  {
    id: '111',
    hawkerCentreId: 35,
    reason: 'others',
    name: 'Petalburg Gym',
    startDate: '2021-03-30',
    endDate: '2100-01-01',
  },
];

export const mockHawkerCentres: HawkerCentre[] = [
  {
    hawkerCentreId: 1,
    name: 'Littleroot Town',
    address: 'Littleroot Town',
  },
  {
    hawkerCentreId: 2,
    name: 'Oldale Town',
    address: 'Oldale Town',
  },
  {
    hawkerCentreId: 3,
    name: 'Rustboro City',
    address: 'Rustboro City',
  },
  {
    hawkerCentreId: 4,
    name: 'Slateport City',
    address: 'Slateport City',
  },
  {
    hawkerCentreId: 5,
    name: 'Melville City',
    address: 'Melville City',
  },
  {
    hawkerCentreId: 6,
    name: 'Verdanturf Town',
    address: 'Verdanturf Town',
  },
  {
    hawkerCentreId: 7,
    name: 'Route 118 near Melville City',
    address: 'Route 118',
  },
  {
    hawkerCentreId: 11,
    name: 'Devon Corporation',
    address: 'Rustboro City',
  },
  {
    hawkerCentreId: 12,
    name: 'Slateport Market',
    address: 'Slateport City',
  },
  {
    hawkerCentreId: 13,
    name: 'Fortree Market',
    address: 'Fortree City',
  },
  {
    hawkerCentreId: 31,
    name: 'Rustboro Gym',
    address: 'Rustboro City',
    nameSecondary: 'Rocky road ahead',
  },
  {
    hawkerCentreId: 32,
    name: 'Dewford Gym',
    address: 'Dewford Town',
    nameSecondary: "Surfer's Paradise",
  },
  {
    hawkerCentreId: 33,
    name: 'Mauville Gym',
    address: 'Mauville City',
    nameSecondary: "Nikola Tesla's descendants",
  },
  {
    hawkerCentreId: 34,
    name: 'Lavaridge Gym',
    address: 'Lavaridge Town',
    nameSecondary: 'Land of hot springs',
  },
  {
    hawkerCentreId: 35,
    name: 'Petalburg Gym',
    address: 'Petalburg City',
    nameSecondary: 'Slaking the king',
  },
  {
    hawkerCentreId: 36,
    name: 'Fortree Gym',
    address: 'Fortree City',
    nameSecondary: 'Treehouse living',
  },
  {
    hawkerCentreId: 37,
    name: 'Mossdeep Gym',
    address: 'Mossdeep City',
    nameSecondary: 'Psychics in space',
  },
  {
    hawkerCentreId: 38,
    name: 'Sootopolis Gym',
    address: 'Sootopolis City',
    nameSecondary: 'A town in a crater',
  },
  {
    hawkerCentreId: 39,
    name: 'Sidney Gym',
    address: 'Evergrande City',
    nameSecondary: 'Mightyena used Intimidate',
  },
  {
    hawkerCentreId: 40,
    name: 'Phoebe Gym',
    address: 'Evergrande City',
    nameSecondary: 'Ghostly figures',
  },
  {
    hawkerCentreId: 41,
    name: 'Glacia Gym',
    address: 'Evergrande City',
    nameSecondary: 'Ice cream heaven',
  },
  {
    hawkerCentreId: 42,
    name: 'Drake Gym',
    address: 'Evergrande City',
    nameSecondary: 'How to train a dragon',
  },
  {
    hawkerCentreId: 43,
    name: 'Champion Gym',
    address: 'Evergrande City',
    nameSecondary: 'Where the very best belong',
  },
];

export const mockUser: User = {
  userId: 1,
  username: 'ashketchum',
  languageCode: 'en',
  favourites: [
    {
      hawkerCentreName: 'Littleroot Town',
      dateAdded: '2021-01-15T17:30:52+08:00',
    },
    {
      hawkerCentreName: 'Verdanturf Town',
      dateAdded: '2021-01-10T08:22:20+08:00',
    },
    {
      hawkerCentreName: 'Mossdeep Gym',
      dateAdded: '2021-01-01T15:00:00+08:00',
    },
  ],
  isInFavouritesMode: false,
  notifications: true,
  createdAt: '2021-01-01T00:00:00Z',
};

export const mockUserWithOneFav: User = {
  userId: 2,
  username: 'misty',
  languageCode: 'en',
  favourites: [
    {
      hawkerCentreName: 'Verdanturf Town',
      dateAdded: '2021-01-15T17:30:52+08:00',
    },
  ],
  isInFavouritesMode: false,
  notifications: true,
  createdAt: '2021-01-01T00:00:00Z',
};

export const mockUserWithNoFavs: User = {
  userId: 3,
  username: 'brock',
  languageCode: 'en',
  favourites: [],
  isInFavouritesMode: false,
  notifications: false,
  createdAt: '2021-01-01T00:00:00Z',
};

export const mockUserInFavMode: User = {
  userId: 4,
  username: 'nursejoy',
  languageCode: 'en',
  favourites: [],
  isInFavouritesMode: true,
  notifications: true,
  createdAt: '2021-01-01T00:00:00Z',
};

export const mockUsers: User[] = [
  // user has 1 favourite HC closed today, language en
  mockUser,
  // user has 0 favourite HCs closed today
  mockUserInFavMode,
  // user has 2 favourite HCs closed today, language zh
  {
    userId: 5,
    username: 'meowth',
    languageCode: 'zh',
    favourites: [
      {
        hawkerCentreName: 'Melville City',
        dateAdded: '2021-01-08T09:05:12+08:00',
      },
      {
        hawkerCentreName: 'Verdanturf Town',
        dateAdded: '2021-01-08T09:05:45+08:00',
      },
    ],
    isInFavouritesMode: false,
    notifications: true,
    createdAt: '2021-01-01T00:00:00Z',
  },
];

export const mockTelegramUser: TelegramUser = {
  id: 1,
  is_bot: false,
  first_name: 'Ash',
  last_name: 'Ketchum',
  username: 'ashketchum',
};

export const mockInputs: Input[] = [
  {
    userId: 1,
    username: 'ashketchum',
    text: 'littleroot',
    createdAtTimestamp: 1609804800000000,
  },
];

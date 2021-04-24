import { TelegramUser } from '../../src/common/telegram';
import {
  ClosureReason,
  HawkerCentreInfo,
  Result,
  User,
} from '../../src/common/types';

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
    hawkerCentreId: 2,
    reason: ClosureReason.cleaning,
    name: 'Oldale Town',
    startDate: '2021-01-15',
    endDate: '2021-01-18',
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
];

export const mockHawkerCentres: HawkerCentreInfo[] = [
  {
    hawkerCentreId: 1,
    name: 'Devon Corporation',
  },
  {
    hawkerCentreId: 2,
    name: 'Slateport Market',
  },
  {
    hawkerCentreId: 3,
    name: 'Fortree Market',
  },
  {
    hawkerCentreId: 11,
    name: 'Rustboro Gym',
    nameSecondary: 'Rocky road ahead',
  },
  {
    hawkerCentreId: 12,
    name: 'Dewford Gym',
    nameSecondary: "Surfer's Paradise",
  },
  {
    hawkerCentreId: 13,
    name: 'Mauville Gym',
    nameSecondary: "Nikola Tesla's descendants",
  },
  {
    hawkerCentreId: 14,
    name: 'Lavaridge Gym',
    nameSecondary: 'Land of hot springs',
  },
  {
    hawkerCentreId: 15,
    name: 'Petalburg Gym',
    nameSecondary: 'Slaking the king',
  },
  {
    hawkerCentreId: 16,
    name: 'Fortree Gym',
    nameSecondary: 'Treehouse living',
  },
  {
    hawkerCentreId: 17,
    name: 'Mossdeep Gym',
    nameSecondary: 'Psychics in space',
  },
  {
    hawkerCentreId: 18,
    name: 'Sootopolis Gym',
    nameSecondary: 'A town in a crater',
  },
  {
    hawkerCentreId: 19,
    name: 'Sidney Gym',
    nameSecondary: 'Mightyena used Intimidate',
  },
  {
    hawkerCentreId: 20,
    name: 'Phoebe Gym',
    nameSecondary: 'Ghostly figures',
  },
  {
    hawkerCentreId: 21,
    name: 'Glacia Gym',
    nameSecondary: 'Ice cream heaven',
  },
  {
    hawkerCentreId: 22,
    name: 'Drake Gym',
    nameSecondary: 'How to train a dragon',
  },
  {
    hawkerCentreId: 23,
    name: 'Champion Gym',
    nameSecondary: 'Where the very best belong',
  },
];

export const mockUser: User = {
  userId: 1,
  username: 'ashketchum',
  languageCode: 'en',
  favourites: [17, 13],
};

export const mockTelegramUser: TelegramUser = {
  id: 1,
  is_bot: false,
  first_name: 'Ash',
  last_name: 'Ketchum',
  username: 'ashketchum',
  language_code: 'en',
};

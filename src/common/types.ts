export enum Module {
  search = 'search',
  favourites = 'favourites',
  general = 'general',
}

export type BotResponse = {
  message: string;
  choices?: string[];
};

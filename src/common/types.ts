export enum Module {
  search = 'search',
  favourites = 'favourites',
  feedback = 'feedback',
  general = 'general',
}

export type BotResponse = {
  message: string;
  choices?: string[];
};

import { BotResponse } from '../../common/types';
import { addNewHCToFavourites } from './logic';

export * from './logic';

export async function manageFavourites(
  text: string,
): Promise<BotResponse | null> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav':
      return addNewHCToFavourites(keyword);
    default:
      return null;
  }
}

import { addNewHCToFavourites } from './logic';
import { SearchHCResponse } from './types';

export * from './logic';
export * from './types';

// TODO: to update return type when adding more favourites commands
export async function manageFavourites(
  text: string,
): Promise<SearchHCResponse | null> {
  const [command, ...keywordSplit] = text.split(' ');
  const keyword = keywordSplit.join(' ');

  switch (command) {
    case '/fav':
      return addNewHCToFavourites(keyword);
    default:
      return null;
  }
}

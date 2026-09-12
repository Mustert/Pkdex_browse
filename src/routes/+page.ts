import { loadCards } from '$lib/data/cards';
import { loadPokedex } from '$lib/data/pokedex';
import { loadRarities } from '$lib/data/rarities';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const [pokedex, cards, rarities] = await Promise.all([
    loadPokedex(),
    loadCards(),
    loadRarities()
  ]);
  return { pokedex, cards, rarities };
};

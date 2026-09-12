import { loadCards } from '$lib/data/cards';
import { loadEditions } from '$lib/data/editions';
import { loadPokedex } from '$lib/data/pokedex';
import { loadRarities } from '$lib/data/rarities';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const [karten, editionen, rarities, pokedex] = await Promise.all([
    loadCards(),
    loadEditions(),
    loadRarities(),
    loadPokedex()
  ]);
  return { karten, editionen, rarities, pokedex };
};

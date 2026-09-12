import { loadCards } from '$lib/data/cards';
import { loadEditions } from '$lib/data/editions';
import { loadRarities } from '$lib/data/rarities';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const [karten, editionen, rarities] = await Promise.all([
    loadCards(),
    loadEditions(),
    loadRarities()
  ]);
  return { karten, editionen, rarities };
};

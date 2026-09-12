import { error } from '@sveltejs/kit';
import { loadCards } from '$lib/data/cards';
import { loadEditions } from '$lib/data/editions';
import { loadPokedex } from '$lib/data/pokedex';
import { loadRarities } from '$lib/data/rarities';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const [karten, editionen, rarities, pokedex] = await Promise.all([
    loadCards(),
    loadEditions(),
    loadRarities(),
    loadPokedex()
  ]);

  const karte = karten.find((k) => k.id === params.id);
  if (!karte) throw error(404, `Keine Karte mit ID ${params.id}`);

  const edition = editionen.find((e) => e.kuerzel === karte.editionKuerzel) ?? null;
  const rarity = karte.seltenheitDe ? (rarities.find((r) => r.de === karte.seltenheitDe) ?? null) : null;
  const pokemon = karte.dexIds
    .map((id) => pokedex.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return { karte, edition, rarity, pokemon };
};

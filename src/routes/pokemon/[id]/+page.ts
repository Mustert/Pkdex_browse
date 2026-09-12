import { error } from '@sveltejs/kit';
import { kartenFuerDex } from '$lib/cards/byDex';
import { loadCards } from '$lib/data/cards';
import { findPokemon, loadPokedex } from '$lib/data/pokedex';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Ungültige Pokédex-Nummer');

  const entry = await findPokemon(id);
  if (!entry) throw error(404, `Kein Pokémon mit Nummer ${id}`);

  const [alle, alleKarten] = await Promise.all([loadPokedex(), loadCards()]);
  const vorher = alle.filter((p) => p.id < id).at(-1) ?? null;
  const nachher = alle.find((p) => p.id > id) ?? null;
  const vorentwicklung = entry.evolvesFromId ? await findPokemon(entry.evolvesFromId) : null;
  const karten = kartenFuerDex(alleKarten, id);

  return { entry, vorher, nachher, vorentwicklung: vorentwicklung ?? null, karten };
};

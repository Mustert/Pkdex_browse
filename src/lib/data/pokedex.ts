import { base } from '$app/paths';
import type { PokedexEntry, PokedexFile } from './types';

/**
 * Datenzugriff auf den Pokedex. Kennt nur Laden + Cachen – keine UI, keine Filterlogik.
 * Das Promise wird im Modul-Scope gehalten, sodass die JSON pro Session einmal geholt wird.
 */

let cache: Promise<PokedexEntry[]> | null = null;

export function loadPokedex(): Promise<PokedexEntry[]> {
  cache ??= fetch(`${base}/data/pokedex.json`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`pokedex.json: HTTP ${res.status}. Wurde \`npm run pokedex\` ausgeführt?`);
      }
      return res.json() as Promise<PokedexFile>;
    })
    .then((file) => [...file.pokemon].sort((a, b) => a.id - b.id));
  return cache;
}

export async function findPokemon(id: number): Promise<PokedexEntry | undefined> {
  const list = await loadPokedex();
  return list.find((p) => p.id === id);
}

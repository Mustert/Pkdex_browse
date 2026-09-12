import type { PokedexEntry } from '$lib/data/types';

/** National-Dex-Nummer als "#0006". */
export function dexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

/** Typ-Slug + deutsches Label zu Paaren zusammenfassen (statt parallele Arrays zu indizieren). */
export function typeList(
  p: Pick<PokedexEntry, 'types' | 'typesDe'>
): Array<{ slug: string; name: string }> {
  return p.types.map((slug, i) => ({ slug, name: p.typesDe[i] ?? slug }));
}

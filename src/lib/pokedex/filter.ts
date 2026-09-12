import type { PokedexEntry } from '$lib/data/types';

export interface PokedexFilterCriteria {
  /** Freitext: Teilstring in Name (DE/EN) oder exakte Dex-Nummer (mit/ohne "#"). */
  query?: string;
  /** Generationen (ODER-verknuepft). Leer = keine Einschraenkung. */
  generations?: number[];
}

/**
 * Reine Funktion – kein Svelte, kein DOM. Deshalb ohne Browser mit Vitest testbar
 * (siehe filter.test.ts) und in jeder Komponente wiederverwendbar.
 */
export function filterPokedex(
  list: readonly PokedexEntry[],
  criteria: PokedexFilterCriteria = {}
): PokedexEntry[] {
  const query = criteria.query?.trim().toLowerCase() ?? '';
  const numeric = query.replace(/^#/, '');
  const generations = criteria.generations ?? [];

  return list.filter((p) => {
    if (generations.length > 0 && !generations.includes(p.generation)) return false;
    if (query === '') return true;
    return (
      p.name.de.toLowerCase().includes(query) ||
      p.name.en.toLowerCase().includes(query) ||
      String(p.id) === numeric
    );
  });
}

/** Alle in der Liste vorkommenden Generationen, sortiert und ohne Duplikate. */
export function availableGenerations(list: readonly PokedexEntry[]): number[] {
  return [...new Set(list.map((p) => p.generation))].sort((a, b) => a - b);
}

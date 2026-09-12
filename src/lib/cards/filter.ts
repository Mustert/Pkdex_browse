import type { Card } from '$lib/data/types';

export interface CardFilterCriteria {
  /** Freitext: Teilstring im Kartennamen. */
  query?: string;
  /** Editionskuerzel (ODER-verknuepft). Leer = keine Einschraenkung. */
  editionen?: string[];
  /** Rarity.de-Werte (ODER-verknuepft). Leer = keine Einschraenkung. */
  seltenheiten?: string[];
}

/** Reine Funktion – kein Svelte, kein DOM, per Vitest testbar (siehe filter.test.ts). */
export function filterCards(list: readonly Card[], criteria: CardFilterCriteria = {}): Card[] {
  const query = criteria.query?.trim().toLowerCase() ?? '';
  const editionen = criteria.editionen ?? [];
  const seltenheiten = criteria.seltenheiten ?? [];

  return list.filter((k) => {
    if (editionen.length > 0 && !editionen.includes(k.editionKuerzel)) return false;
    if (seltenheiten.length > 0 && (!k.seltenheitDe || !seltenheiten.includes(k.seltenheitDe))) {
      return false;
    }
    if (query === '') return true;
    return k.name.toLowerCase().includes(query);
  });
}

import { describe, expect, it } from 'vitest';
import type { Card } from '$lib/data/types';
import { filterCards } from './filter';

function card(id: string, name: string, edition: string, seltenheitDe: string | null): Card {
  return { id, editionKuerzel: edition, nummer: '001', name, seltenheitDe, dexIds: [], bild: null };
}

const karten: Card[] = [
  card('a', 'Bisasam', 'SVI', 'häufig'),
  card('b', 'Glurak-ex', 'MEW', 'doppelselten'),
  card('c', 'Pokéball', 'SVI', null)
];

describe('filterCards', () => {
  it('ohne Kriterien: alle Karten', () => {
    expect(filterCards(karten)).toHaveLength(3);
  });

  it('filtert per Namens-Teilstring, unabhaengig von Gross-/Kleinschreibung', () => {
    expect(filterCards(karten, { query: 'glurak' }).map((k) => k.id)).toEqual(['b']);
  });

  it('filtert per Edition (ODER-verknuepft)', () => {
    expect(filterCards(karten, { editionen: ['MEW'] }).map((k) => k.id)).toEqual(['b']);
  });

  it('filtert per Seltenheit und schliesst Karten ohne bekannte Seltenheit aus', () => {
    expect(filterCards(karten, { seltenheiten: ['häufig'] }).map((k) => k.id)).toEqual(['a']);
  });

  it('kombiniert Edition und Seltenheit (UND-verknuepft)', () => {
    expect(filterCards(karten, { editionen: ['SVI'], seltenheiten: ['häufig'] }).map((k) => k.id)).toEqual(['a']);
  });
});

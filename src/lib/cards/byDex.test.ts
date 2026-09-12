import { describe, expect, it } from 'vitest';
import type { Card } from '$lib/data/types';
import { kartenFuerDex, kartenNachDexId, sortiereKarten } from './byDex';

function card(id: string, dexIds: number[], edition = 'SVI', nummer = '001'): Card {
  return { id, editionKuerzel: edition, nummer, name: id, seltenheitDe: 'häufig', dexIds, bild: null };
}

describe('kartenNachDexId', () => {
  it('gruppiert Karten nach jeder ihrer dexIds', () => {
    const karten = [card('a', [1]), card('b', [1, 2]), card('c', [3])];
    const map = kartenNachDexId(karten);
    expect(map.get(1)?.map((k) => k.id)).toEqual(['a', 'b']);
    expect(map.get(2)?.map((k) => k.id)).toEqual(['b']);
    expect(map.get(3)?.map((k) => k.id)).toEqual(['c']);
  });

  it('ignoriert Karten ohne dexIds (Trainer/Energie)', () => {
    const karten = [card('t', [])];
    expect(kartenNachDexId(karten).size).toBe(0);
  });
});

describe('sortiereKarten', () => {
  it('sortiert nach Edition, dann numerisch nach Nummer', () => {
    const karten = [
      card('z', [1], 'SVI', '010'),
      card('x', [1], 'PAL', '010'),
      card('y', [1], 'SVI', '002')
    ];
    expect(sortiereKarten(karten).map((k) => k.id)).toEqual(['x', 'y', 'z']);
  });
});

describe('kartenFuerDex', () => {
  it('filtert und sortiert die Karten eines einzelnen Pokemon', () => {
    const karten = [card('a', [1], 'SVI', '010'), card('b', [2]), card('c', [1], 'PAL', '001')];
    expect(kartenFuerDex(karten, 1).map((k) => k.id)).toEqual(['c', 'a']);
  });
});

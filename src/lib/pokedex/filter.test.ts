import { describe, expect, it } from 'vitest';
import type { PokedexEntry } from '$lib/data/types';
import { availableGenerations, filterPokedex } from './filter';

function entry(over: Partial<PokedexEntry> & { id: number }): PokedexEntry {
  const defaults: Omit<PokedexEntry, 'id'> = {
    name: { de: 'Test', en: 'Test' },
    genus: { de: '', en: '' },
    generation: 1,
    types: [],
    typesDe: [],
    color: null,
    sprite: null,
    artwork: null,
    flavorText: { de: '', en: '' },
    evolvesFromId: null,
    istLegendaer: false,
    istMysterioes: false,
    istBaby: false,
    formen: []
  };
  return { ...defaults, ...over };
}

const list: PokedexEntry[] = [
  entry({ id: 1, name: { de: 'Bisasam', en: 'Bulbasaur' }, generation: 1 }),
  entry({ id: 4, name: { de: 'Glumanda', en: 'Charmander' }, generation: 1 }),
  entry({ id: 387, name: { de: 'Chelast', en: 'Turtwig' }, generation: 4 }),
  entry({ id: 906, name: { de: 'Felori', en: 'Sprigatito' }, generation: 9 })
];

describe('filterPokedex', () => {
  it('gibt ohne Kriterien alles zurück', () => {
    expect(filterPokedex(list)).toHaveLength(4);
  });

  it('matcht deutschen und englischen Namen (case-insensitive)', () => {
    expect(filterPokedex(list, { query: 'GLUM' }).map((p) => p.id)).toEqual([4]);
    expect(filterPokedex(list, { query: 'turtwig' }).map((p) => p.id)).toEqual([387]);
  });

  it('matcht exakte Dex-Nummer, auch mit "#"', () => {
    expect(filterPokedex(list, { query: '387' }).map((p) => p.id)).toEqual([387]);
    expect(filterPokedex(list, { query: '#906' }).map((p) => p.id)).toEqual([906]);
    expect(filterPokedex(list, { query: '38' })).toHaveLength(0);
  });

  it('filtert nach mehreren Generationen (ODER)', () => {
    expect(filterPokedex(list, { generations: [1, 9] }).map((p) => p.id)).toEqual([1, 4, 906]);
  });

  it('kombiniert Text- und Generationsfilter (UND)', () => {
    expect(filterPokedex(list, { query: 'a', generations: [4] }).map((p) => p.id)).toEqual([387]);
  });
});

describe('availableGenerations', () => {
  it('liefert sortierte, eindeutige Generationen', () => {
    expect(availableGenerations(list)).toEqual([1, 4, 9]);
  });
});

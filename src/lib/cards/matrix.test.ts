import { describe, expect, it } from 'vitest';
import type { Card, PokedexEntry, Rarity } from '$lib/data/types';
import { baueMatrix, matrixSpalten, SPALTEN_RAENGE } from './matrix';

const rarities: Rarity[] = [
  r('häufig', 1),
  r('nicht so häufig', 2),
  r('selten', 3),
  r('doppelselten', 4),
  r('selten, ASS-KLASSE', 5),
  r('selten, Illustration', 6),
  r('ultraselten', 7),
  r('selten, besondere Illustration', 8),
  r('hyperselten', 13),
  r('Standardset', 0)
];

function r(de: string, rang: number): Rarity {
  return {
    de,
    en: de.toUpperCase(),
    abk: null,
    kategorie: 'sv',
    rang,
    symbol: '',
    glyph: null,
    farbe: null,
    pokemontcgIo: null,
    tcgdex: null,
    abEdition: 'SVI',
    hinweis: null
  };
}

function pokemon(id: number): PokedexEntry {
  return {
    id,
    name: { de: `P${id}`, en: `P${id}` },
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
}

function card(id: string, dexIds: number[], seltenheitDe: string, edition = 'SVI', nummer = '001'): Card {
  return { id, editionKuerzel: edition, nummer, name: id, seltenheitDe, dexIds, bild: null };
}

describe('matrixSpalten', () => {
  const spalten = matrixSpalten(rarities);

  it('hat die festen Spalten plus "Sonstige"', () => {
    expect(spalten.map((s) => s.rang)).toEqual([...SPALTEN_RAENGE, null]);
  });

  it('bündelt in "Sonstige" alle übrigen Grade > Rang 0', () => {
    const sonstige = spalten.at(-1)!;
    expect(sonstige.seltenheiten).toEqual([
      'selten, ASS-KLASSE',
      'ultraselten',
      'hyperselten'
    ]);
    expect(sonstige.seltenheiten).not.toContain('Standardset');
  });
});

describe('baueMatrix', () => {
  const spalten = matrixSpalten(rarities);

  it('legt je Pokemon eine Zeile in Pokedex-Reihenfolge an', () => {
    const zeilen = baueMatrix([pokemon(3), pokemon(1)], [], spalten);
    expect(zeilen.map((z) => z.pokemon.id)).toEqual([3, 1]);
    expect(zeilen[0].gesamt).toBe(0);
  });

  it('sortiert Karten in die richtige Spalte', () => {
    const karten = [
      card('a', [1], 'häufig'),
      card('b', [1], 'selten'),
      card('c', [1], 'hyperselten') // -> Sonstige
    ];
    const [zeile] = baueMatrix([pokemon(1)], karten, spalten);
    expect(zeile.gesamt).toBe(3);
    expect(zeile.zellen[0].karten.map((k) => k.id)).toEqual(['a']); // häufig
    expect(zeile.zellen[2].karten.map((k) => k.id)).toEqual(['b']); // selten
    expect(zeile.zellen.at(-1)!.karten.map((k) => k.id)).toEqual(['c']); // Sonstige
  });

  it('zählt eine Karte mit mehreren dexIds bei jedem Pokemon', () => {
    const karten = [card('duo', [1, 2], 'selten')];
    const zeilen = baueMatrix([pokemon(1), pokemon(2)], karten, spalten);
    expect(zeilen[0].gesamt).toBe(1);
    expect(zeilen[1].gesamt).toBe(1);
  });

  it('sortiert Badges je Zelle nach Edition (alphabetisch), dann numerisch nach Nummer', () => {
    const karten = [
      card('z', [1], 'häufig', 'SVI', '010'),
      card('x', [1], 'häufig', 'PAL', '010'),
      card('y', [1], 'häufig', 'SVI', '002')
    ];
    const [zeile] = baueMatrix([pokemon(1)], karten, spalten);
    expect(zeile.zellen[0].karten.map((k) => k.id)).toEqual(['x', 'y', 'z']);
  });
});

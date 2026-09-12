import { describe, expect, it } from 'vitest';
import type { Card, Edition, PokedexEntry, Rarity } from '$lib/data/types';
import {
  besessenNachSpezies,
  besesseneKarten,
  editionsAnalyse,
  ueberblick
} from './analyse';

function card(id: string, edition: string, nummer: string, seltenheitDe: string | null, dexIds: number[]): Card {
  return { id, editionKuerzel: edition, nummer, name: id, seltenheitDe, dexIds, bild: null };
}

function poke(id: number, name: string): PokedexEntry {
  return {
    id,
    name: { de: name, en: name },
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

const rarities: Rarity[] = [
  { de: 'häufig', en: 'Common', abk: null, kategorie: 'grundlegend', rang: 1, symbol: '', glyph: null, farbe: 'schwarz', pokemontcgIo: null, tcgdex: null, abEdition: '', hinweis: null },
  { de: 'nicht so häufig', en: 'Uncommon', abk: null, kategorie: 'grundlegend', rang: 2, symbol: '', glyph: null, farbe: 'schwarz', pokemontcgIo: null, tcgdex: null, abEdition: '', hinweis: null },
  { de: 'doppelselten', en: 'Double Rare', abk: null, kategorie: 'sv', rang: 4, symbol: '', glyph: null, farbe: 'schwarz', pokemontcgIo: null, tcgdex: null, abEdition: '', hinweis: null },
  { de: 'selten, besondere Illustration', en: 'SIR', abk: null, kategorie: 'spezial', rang: 8, symbol: '', glyph: null, farbe: 'gold', pokemontcgIo: null, tcgdex: null, abEdition: '', hinweis: null }
];

const editionen: Edition[] = [
  { name: 'Testset A', erscheinungsdatum: '2023-01-01', kuerzel: 'TSA', anzahlKarten: 100, serie: 'X' },
  { name: 'Testset B', erscheinungsdatum: '2023-06-01', kuerzel: 'TSB', anzahlKarten: 100, serie: 'X' }
];

// Pkmn 5 hat bewusst keine Karte -> testet "noch in keiner Edition".
const pokedex = [poke(1, 'Eins'), poke(2, 'Zwei'), poke(3, 'Drei'), poke(4, 'Vier'), poke(5, 'Fünf')];

// TSA: Pkmn1 häufig, Pkmn2 häufig, Pkmn3 nur doppelselten
// TSB: Pkmn3 häufig, Pkmn4 nur besondere Illustration, Trainer ohne dexId
const karten: Card[] = [
  card('TSA-001', 'TSA', '001', 'häufig', [1]),
  card('TSA-002', 'TSA', '002', 'häufig', [2]),
  card('TSA-003', 'TSA', '003', 'doppelselten', [3]),
  card('TSB-001', 'TSB', '001', 'häufig', [3]),
  card('TSB-002', 'TSB', '002', 'selten, besondere Illustration', [4]),
  card('TSB-003', 'TSB', '003', 'häufig', [])
];

describe('ueberblick', () => {
  it('Maximalziel ist die ganze Dex, nicht nur was Karten hat', () => {
    const u = ueberblick(karten, pokedex, new Set());
    expect(u.speziesGesamt).toBe(5);
    expect(u.speziesMitKarten).toBe(4); // Pkmn 5 hat keine Karte
    expect(u.speziesOhneKarte).toBe(1);
    expect(u.speziesBesessen).toBe(0);
    expect(u.speziesFehlend).toBe(5); // fehlend zum kompletten Pokédex
    expect(u.kartenBesessen).toBe(0);
    expect(u.fortschritt).toBe(0);
    expect(u.erreichbar).toBeCloseTo(4 / 5);
  });

  it('Fortschritt misst am Maximalziel 1025 (hier: 5)', () => {
    const u = ueberblick(karten, pokedex, new Set(['TSA-001', 'TSA-002']));
    expect(u.speziesBesessen).toBe(2);
    expect(u.speziesFehlend).toBe(3);
    expect(u.fortschritt).toBeCloseTo(2 / 5);
  });
});

describe('editionsAnalyse – "lohnt sich ein Booster?"', () => {
  it('leere Sammlung: TSA grün (häufige Lücken ziehbar)', () => {
    const a = editionsAnalyse(karten, editionen, rarities, new Set());
    const tsa = a.find((e) => e.edition.kuerzel === 'TSA')!;
    expect(tsa.ampel).toBe('gruen');
    const haeufig = tsa.proSeltenheit.find((z) => z.rang === 1)!;
    expect(haeufig.fehlendeSpeziesZiehbar).toBe(2);
  });

  it('alle häufigen aus TSA gesammelt -> nur noch doppelselt. Lücke -> orange', () => {
    const a = editionsAnalyse(karten, editionen, rarities, new Set(['TSA-001', 'TSA-002']));
    const tsa = a.find((e) => e.edition.kuerzel === 'TSA')!;
    expect(tsa.proSeltenheit.find((z) => z.rang === 1)!.fehlendeSpeziesZiehbar).toBe(0);
    expect(tsa.proSeltenheit.find((z) => z.rang === 4)!.fehlendeSpeziesZiehbar).toBe(1);
    expect(tsa.cuSpeziesFehlend).toBe(0);
    expect(tsa.ampel).toBe('orange');
  });

  it('Pkmn3 anderswo (TSB häufig) gezogen -> TSA doppelselt.-Lücke verschwindet -> rot', () => {
    const a = editionsAnalyse(karten, editionen, rarities, new Set(['TSA-001', 'TSA-002', 'TSB-001']));
    const tsa = a.find((e) => e.edition.kuerzel === 'TSA')!;
    expect(tsa.fehlendeSpeziesZiehbarGesamt).toBe(0);
    expect(tsa.ampel).toBe('rot');
  });

  it('halb volle häufig-Lücke -> gelb, volle -> grün', () => {
    // TSA: Pkmn1, Pkmn2 häufig. Beide offen -> 2/2 > 50% -> grün.
    const leer = editionsAnalyse(karten, editionen, rarities, new Set());
    expect(leer.find((e) => e.edition.kuerzel === 'TSA')!.ampel).toBe('gruen');
    // Eine von zwei häufigen Spezies gesammelt -> 1/2, nicht > 50% -> gelb.
    const halb = editionsAnalyse(karten, editionen, rarities, new Set(['TSA-001']));
    const tsa = halb.find((e) => e.edition.kuerzel === 'TSA')!;
    expect(tsa.cuSpeziesGesamt).toBe(2);
    expect(tsa.cuSpeziesFehlend).toBe(1);
    expect(tsa.ampel).toBe('gelb');
  });

  it('neuesPokemonChance: leer = sicher, alles gesammelt = 0, teils = dazwischen', () => {
    const eds: Edition[] = [
      { name: 'Chance-Set', erscheinungsdatum: '2023-01-01', kuerzel: 'CS', anzahlKarten: 20, serie: 'Karmesin & Purpur' }
    ];
    const ks: Card[] = [1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
      card(`CS-00${i}`, 'CS', `00${i}`, 'häufig', [i])
    );

    const leer = editionsAnalyse(ks, eds, rarities, new Set())[0];
    expect(leer.neuesPokemonChance).toBe(1);

    const voll = editionsAnalyse(ks, eds, rarities, new Set(ks.map((k) => k.id)))[0];
    expect(voll.neuesPokemonChance).toBe(0);
    expect(voll.neueKartenErwartung).toBe(0);
    expect(voll.neueKartenPMindestens).toEqual([1]);

    const teils = editionsAnalyse(
      ks,
      eds,
      rarities,
      new Set(['CS-001', 'CS-002', 'CS-003', 'CS-004', 'CS-005', 'CS-006'])
    )[0];
    expect(teils.neuesPokemonChance).toBeGreaterThan(0);
    expect(teils.neuesPokemonChance).toBeLessThan(1);
  });

  it('neueKartenPMindestens: monoton fallend, [0]=1, konsistent mit Erwartung und Chance', () => {
    const eds: Edition[] = [
      { name: 'Dist', erscheinungsdatum: '2023-01-01', kuerzel: 'D', anzahlKarten: 20, serie: 'Karmesin & Purpur' }
    ];
    const ks: Card[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
      card(`D-${i}`, 'D', `${i}`, 'häufig', [i])
    );
    const e = editionsAnalyse(
      ks,
      eds,
      rarities,
      new Set(['D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7'])
    )[0];
    const p = e.neueKartenPMindestens;

    expect(p[0]).toBeCloseTo(1, 10);
    for (let m = 1; m < p.length; m++) expect(p[m]).toBeLessThanOrEqual(p[m - 1] + 1e-12);
    expect(e.neuesPokemonChance).toBeCloseTo(p[1], 10);
    // E[X] = Σ_{m≥1} P(X ≥ m) für nichtnegative ganzzahlige X
    expect(e.neueKartenErwartung).toBeCloseTo(
      p.slice(1).reduce((s, x) => s + x, 0),
      6
    );
  });

  it('Kartenzählung schließt Trainer ohne dexId in Gesamt ein', () => {
    const a = editionsAnalyse(karten, editionen, rarities, new Set());
    const tsb = a.find((e) => e.edition.kuerzel === 'TSB')!;
    expect(tsb.kartenGesamt).toBe(3);
    expect(tsb.speziesImSet).toBe(2);
  });
});

describe('besessenNachSpezies / besesseneKarten', () => {
  it('listet besessene Spezies mit Kartenzahl', () => {
    const rows = besessenNachSpezies(karten, pokedex, new Set(['TSA-003', 'TSB-001']));
    expect(rows).toHaveLength(1);
    expect(rows[0].pokemon.id).toBe(3);
    expect(rows[0].kartenBesessen).toBe(2);
    expect(rows[0].kartenGesamt).toBe(2);
  });

  it('besesseneKarten sortiert nach Edition/Nummer', () => {
    const k = besesseneKarten(karten, new Set(['TSB-002', 'TSA-001']));
    expect(k.map((c) => c.id)).toEqual(['TSA-001', 'TSB-002']);
  });
});

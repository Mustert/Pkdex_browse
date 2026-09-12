import type { Card, PokedexEntry, Rarity } from '$lib/data/types';
import { kartenNachDexId, sortiereKarten } from './byDex';

/**
 * Baut die Zeilen der Uebersichts-Tabelle: eine Zeile je Pokemon, feste Spalten
 * fuer die Raenge 1/2/3/4/6/8, plus eine Sammelspalte "Sonstige" fuer alle
 * weiteren Seltenheitsgrade. Reine Logik – ohne Svelte, per Vitest testbar.
 */

/** Raenge, die eine eigene Spalte bekommen (Reihenfolge = Spaltenreihenfolge). */
export const SPALTEN_RAENGE = [1, 2, 3, 4, 6, 8] as const;

const KURZ_LABEL: Record<number, string> = {
  1: 'häufig',
  2: 'nicht so häufig',
  3: 'selten',
  4: 'doppelselten',
  6: 'Illustration',
  8: 'bes. Illustration'
};

export interface MatrixSpalte {
  /** Rang der Spalte, oder null fuer die Sammelspalte "Sonstige". */
  rang: number | null;
  /** Kurzform fuer die Kopfzeile. */
  label: string;
  /** Volltext fuer den Tooltip des Symbols. */
  tooltip: string;
  /** Welche Rarity.de-Werte in diese Spalte zaehlen. */
  seltenheiten: string[];
}

export function matrixSpalten(rarities: readonly Rarity[]): MatrixSpalte[] {
  const nachRang = new Map(rarities.map((r) => [r.rang, r]));

  const feste: MatrixSpalte[] = SPALTEN_RAENGE.map((rang) => {
    const r = nachRang.get(rang);
    return {
      rang,
      label: KURZ_LABEL[rang] ?? r?.de ?? `Rang ${rang}`,
      tooltip: r ? `${r.de} · ${r.en}` : `Rang ${rang}`,
      seltenheiten: r ? [r.de] : []
    };
  });

  const belegt = new Set(feste.flatMap((s) => s.seltenheiten));
  const rest = rarities.filter((r) => r.rang > 0 && !belegt.has(r.de));

  return [
    ...feste,
    {
      rang: null,
      label: 'Sonstige',
      tooltip: rest.map((r) => r.de).join(', ') || 'Weitere Seltenheiten',
      seltenheiten: rest.map((r) => r.de)
    }
  ];
}

export interface MatrixZelle {
  spalte: MatrixSpalte;
  karten: Card[];
}

export interface MatrixZeile {
  pokemon: PokedexEntry;
  zellen: MatrixZelle[];
  /** Gesamtzahl Karten dieses Pokemon (ueber alle Spalten). */
  gesamt: number;
}

export function baueMatrix(
  pokedex: readonly PokedexEntry[],
  karten: readonly Card[],
  spalten: readonly MatrixSpalte[]
): MatrixZeile[] {
  const kartenNachDex = kartenNachDexId(karten);

  const spalteFuerSeltenheit = new Map<string, MatrixSpalte>();
  for (const spalte of spalten) {
    for (const de of spalte.seltenheiten) spalteFuerSeltenheit.set(de, spalte);
  }

  return pokedex.map((pokemon) => {
    const eigene = kartenNachDex.get(pokemon.id) ?? [];
    const zellen: MatrixZelle[] = spalten.map((spalte) => ({ spalte, karten: [] }));
    const zelleFuerSpalte = new Map(zellen.map((z) => [z.spalte, z]));

    for (const karte of eigene) {
      if (karte.seltenheitDe === null) continue;
      const spalte = spalteFuerSeltenheit.get(karte.seltenheitDe);
      if (spalte) zelleFuerSpalte.get(spalte)!.karten.push(karte);
    }

    for (const zelle of zellen) {
      zelle.karten = sortiereKarten(zelle.karten);
    }

    return { pokemon, zellen, gesamt: eigene.length };
  });
}

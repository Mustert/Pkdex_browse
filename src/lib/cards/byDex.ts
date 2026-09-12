import type { Card } from '$lib/data/types';

/** Sortiert Karten nach Edition (alphabetisch), dann numerisch nach Kartennummer. */
export function sortiereKarten(karten: readonly Card[]): Card[] {
  return [...karten].sort(
    (a, b) =>
      a.editionKuerzel.localeCompare(b.editionKuerzel) ||
      a.nummer.localeCompare(b.nummer, undefined, { numeric: true })
  );
}

/** Gruppiert Karten nach den National-Dex-Nummern der abgebildeten Pokemon. */
export function kartenNachDexId(karten: readonly Card[]): Map<number, Card[]> {
  const map = new Map<number, Card[]>();
  for (const karte of karten) {
    for (const dexId of karte.dexIds) {
      let liste = map.get(dexId);
      if (!liste) {
        liste = [];
        map.set(dexId, liste);
      }
      liste.push(karte);
    }
  }
  return map;
}

/** Alle Karten eines einzelnen Pokemon, sortiert nach Edition/Nummer. */
export function kartenFuerDex(karten: readonly Card[], dexId: number): Card[] {
  return sortiereKarten(karten.filter((k) => k.dexIds.includes(dexId)));
}

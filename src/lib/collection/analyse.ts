import { boosterModell, type BoosterModell } from '$lib/booster/modell';
import type { Card, Edition, PokedexEntry, Rarity } from '$lib/data/types';

/**
 * Reine Auswertung der Sammlung – kein Svelte, kein DOM (Vitest-testbar).
 *
 * Leitfrage: „Ich will den Pokédex vervollständigen. Lohnt sich noch ein Booster
 * einer Edition, oder ziehe ich dort nur noch Dubletten?“
 *
 * „Pokédex vervollständigen“ heißt hier: von jeder Spezies mindestens **eine**
 * beliebige Karte besitzen. Eine Spezies gilt als „fehlend“, wenn man keine
 * einzige ihrer Karten hat.
 */

export interface Ueberblick {
  kartenImDatensatz: number;
  kartenBesessen: number;
  /** Maximalziel: alle Pokémon der National-Dex (aktuell 1025). */
  speziesGesamt: number;
  /** Davon derzeit überhaupt als Karte erhältlich (in den geladenen Editionen). */
  speziesMitKarten: number;
  /** Pokémon, die es in noch keiner geladenen Edition als Karte gibt. */
  speziesOhneKarte: number;
  /** Verschiedene Pokémon in der Sammlung (auf die National-Dex begrenzt). */
  speziesBesessen: number;
  /** Fehlend zum kompletten Pokédex (speziesGesamt - speziesBesessen). */
  speziesFehlend: number;
  /** 0–1, gemessen am Maximalziel. */
  fortschritt: number;
  /** 0–1: Anteil, der mit den aktuellen Editionen überhaupt erreichbar wäre. */
  erreichbar: number;
}

export interface SpeziesZeile {
  pokemon: PokedexEntry;
  kartenBesessen: number;
  kartenGesamt: number;
}

/**
 * Vierstufige Farbskala für „lohnt sich ein Booster?“ – gemessen an den
 * häufigen und nicht so häufigen Karten der Edition:
 * - `gruen`  … über die Hälfte dieser Pokémon fehlt noch
 * - `gelb`   … noch welche offen, aber ≤ die Hälfte
 * - `orange` … keine mehr in häufig/nicht so häufig, aber in selteneren Karten
 * - `rot`    … jedes Pokémon der Edition ist schon in der Sammlung
 */
export type Ampel = 'gruen' | 'gelb' | 'orange' | 'rot';

export interface EditionSeltenheitZeile {
  seltenheit: string;
  rang: number;
  farbe: string | null;
  kartenGesamt: number;
  kartenBesessen: number;
  kartenFehlend: number;
  /** Noch fehlende Dex-Spezies, die in dieser Edition in dieser Seltenheit ziehbar sind. */
  fehlendeSpeziesZiehbar: number;
}

export interface EditionAnalyse {
  edition: Edition;
  kartenGesamt: number;
  kartenBesessen: number;
  speziesImSet: number;
  speziesBesessenImSet: number;
  /** Summe fehlendeSpeziesZiehbar über alle Seltenheiten dieser Edition. */
  fehlendeSpeziesZiehbarGesamt: number;
  /** Verschiedene Pokémon auf häufigen/nicht so häufigen Karten dieser Edition. */
  cuSpeziesGesamt: number;
  /** Davon noch nicht in der Sammlung. */
  cuSpeziesFehlend: number;
  /** P(mindestens ein noch fehlendes Pokémon in einem Booster dieser Edition), 0–1. */
  neuesPokemonChance: number;
  /** Erwartete Anzahl noch fehlender Pokémon-Karten pro Booster dieser Edition. */
  neueKartenErwartung: number;
  /** neueKartenPMindestens[m] = P(≥ m neue Karten). Index 0 ist immer 1. */
  neueKartenPMindestens: number[];
  proSeltenheit: EditionSeltenheitZeile[];
  ampel: Ampel;
  empfehlung: string;
}

/** „Häufige“ Ränge – hier entscheidet sich, ob ein billiger Booster den Dex voranbringt. */
const HAEUFIGE_RAENGE = new Set([1, 2]);

function speziesEinerKarte(karte: Card): number[] {
  return karte.dexIds;
}

function rangVon(rarities: readonly Rarity[]): Map<string, Rarity> {
  return new Map(rarities.map((r) => [r.de, r]));
}

/** dexId -> Anzahl bekannter Karten insgesamt. */
function kartenProSpezies(karten: readonly Card[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const k of karten) for (const d of speziesEinerKarte(k)) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
}

/** Menge aller dexIds, von denen mindestens eine Karte besessen wird. */
export function besesseneSpezies(karten: readonly Card[], besitz: ReadonlySet<string>): Set<number> {
  const s = new Set<number>();
  for (const k of karten) {
    if (!besitz.has(k.id)) continue;
    for (const d of speziesEinerKarte(k)) s.add(d);
  }
  return s;
}

export function ueberblick(
  karten: readonly Card[],
  pokedex: readonly PokedexEntry[],
  besitz: ReadonlySet<string>
): Ueberblick {
  const imDex = new Set(pokedex.map((p) => p.id));
  const proSpezies = kartenProSpezies(karten);
  // Nur Karten-Spezies zählen, die auch in der National-Dex stehen.
  const speziesMitKarten = [...proSpezies.keys()].filter((id) => imDex.has(id)).length;
  const besessen = [...besesseneSpezies(karten, besitz)].filter((id) => imDex.has(id)).length;
  const speziesGesamt = pokedex.length;
  const kartenBesessen = karten.reduce((n, k) => n + (besitz.has(k.id) ? 1 : 0), 0);

  return {
    kartenImDatensatz: karten.length,
    kartenBesessen,
    speziesGesamt,
    speziesMitKarten,
    speziesOhneKarte: Math.max(0, speziesGesamt - speziesMitKarten),
    speziesBesessen: besessen,
    speziesFehlend: Math.max(0, speziesGesamt - besessen),
    fortschritt: speziesGesamt === 0 ? 0 : besessen / speziesGesamt,
    erreichbar: speziesGesamt === 0 ? 0 : speziesMitKarten / speziesGesamt
  };
}

/** Besessene Spezies mit Kartenzahl (für „wie viele von welchem“). */
export function besessenNachSpezies(
  karten: readonly Card[],
  pokedex: readonly PokedexEntry[],
  besitz: ReadonlySet<string>
): SpeziesZeile[] {
  const gesamt = kartenProSpezies(karten);
  const besessenAnzahl = new Map<number, number>();
  for (const k of karten) {
    if (!besitz.has(k.id)) continue;
    for (const d of speziesEinerKarte(k)) besessenAnzahl.set(d, (besessenAnzahl.get(d) ?? 0) + 1);
  }
  const nachId = new Map(pokedex.map((p) => [p.id, p]));
  return [...besessenAnzahl.entries()]
    .map(([id, kartenBesessen]) => {
      const pokemon = nachId.get(id);
      return pokemon
        ? { pokemon, kartenBesessen, kartenGesamt: gesamt.get(id) ?? kartenBesessen }
        : null;
    })
    .filter((z): z is SpeziesZeile => z !== null)
    .sort((a, b) => a.pokemon.id - b.pokemon.id);
}

function ampelUndText(
  proSeltenheit: EditionSeltenheitZeile[],
  cuSpeziesGesamt: number,
  cuSpeziesFehlend: number
): { ampel: Ampel; empfehlung: string } {
  const cuAnteil = cuSpeziesGesamt === 0 ? 0 : cuSpeziesFehlend / cuSpeziesGesamt;
  const seltenerOffen = proSeltenheit
    .filter((z) => !HAEUFIGE_RAENGE.has(z.rang))
    .reduce((n, z) => n + z.fehlendeSpeziesZiehbar, 0);

  if (cuAnteil > 0.5) {
    return {
      ampel: 'gruen',
      empfehlung: `Lohnt sich klar: ${cuSpeziesFehlend} von ${cuSpeziesGesamt} Pokémon der häufigen und nicht so häufigen Karten fehlen dir hier noch.`
    };
  }
  if (cuSpeziesFehlend > 0) {
    return {
      ampel: 'gelb',
      empfehlung: `Noch etwas drin: ${cuSpeziesFehlend} von ${cuSpeziesGesamt} Pokémon der häufigen und nicht so häufigen Karten fehlen dir – über die Hälfte hast du aber schon.`
    };
  }
  if (seltenerOffen > 0) {
    return {
      ampel: 'orange',
      empfehlung: `Die häufigen Karten bringen dich nicht mehr weiter – ${seltenerOffen} fehlende Pokémon gibt es hier nur noch ab „selten“ aufwärts.`
    };
  }
  return {
    ampel: 'rot',
    empfehlung: 'Bringt den Pokédex nicht voran – hier ist jedes Pokémon schon in deiner Sammlung.'
  };
}

export interface BoosterNeueKarten {
  /** Erwartete Anzahl noch fehlender Pokémon-Karten in einem Booster. */
  erwartung: number;
  /** pMindestens[m] = P(mindestens m neue Karten). pMindestens[0] ist immer 1. */
  pMindestens: number[];
}

/**
 * Verteilung der Anzahl „neuer“ Karten (zeigen ein noch nicht gesammeltes
 * Pokémon) in einem Booster dieser Edition.
 *
 * Je Booster-Strom eine kleine Zähl-Verteilung: feste Slots ziehen ohne
 * Zurücklegen (hypergeometrisch), Hit-Slots sind Bernoulli(Rate · Anteil neu).
 * Innerhalb einer Seltenheit gilt Gleichverteilung; die Ströme gelten als
 * unabhängig und ihre Verteilungen werden gefaltet.
 */
function boosterNeueKarten(
  setKarten: readonly Card[],
  rangMap: Map<string, Rarity>,
  besessen: ReadonlySet<number>,
  modell: BoosterModell
): BoosterNeueKarten {
  const pool = new Map<string, { gesamt: number; neu: number }>();
  for (const k of setKarten) {
    if (!k.seltenheitDe) continue;
    const rarity = rangMap.get(k.seltenheitDe);
    if (!rarity || rarity.rang <= 0) continue;
    let e = pool.get(k.seltenheitDe);
    if (!e) pool.set(k.seltenheitDe, (e = { gesamt: 0, neu: 0 }));
    e.gesamt += 1;
    if (speziesEinerKarte(k).some((d) => !besessen.has(d))) e.neu += 1;
  }

  let dist = [1];
  for (const slot of modell.slots) {
    let gesamt = 0;
    let neu = 0;
    for (const r of slot.raritaeten) {
      const e = pool.get(r);
      if (!e) continue;
      gesamt += e.gesamt;
      neu += e.neu;
    }
    if (gesamt === 0 || neu === 0) continue;

    const q = slot.proBooster * (neu / gesamt);
    const slotDist =
      Number.isInteger(slot.proBooster) && slot.proBooster >= 1
        ? hypergeomVerteilung(gesamt, neu, Math.min(slot.proBooster, gesamt))
        : [1 - q, q];
    dist = falte(dist, slotDist);
  }

  const erwartung = dist.reduce((summe, p, i) => summe + p * i, 0);
  const pMindestens = dist.map((_, m) => dist.slice(m).reduce((summe, p) => summe + p, 0));
  return { erwartung, pMindestens };
}

/** Verteilung der Trefferzahl bei `k` Ziehungen ohne Zurücklegen (hypergeometrisch). */
function hypergeomVerteilung(gesamt: number, neu: number, k: number): number[] {
  const out: number[] = [];
  for (let j = 0; j <= k; j++) {
    out[j] = (binom(neu, j) * binom(gesamt - neu, k - j)) / binom(gesamt, k);
  }
  return out;
}

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c;
}

/** Faltung zweier Zähl-Verteilungen (Verteilung der Summe zweier unabhängiger Größen). */
function falte(a: number[], b: number[]): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}

export function editionsAnalyse(
  karten: readonly Card[],
  editionen: readonly Edition[],
  rarities: readonly Rarity[],
  besitz: ReadonlySet<string>
): EditionAnalyse[] {
  const rangMap = rangVon(rarities);
  const besessen = besesseneSpezies(karten, besitz);
  const nachEdition = new Map<string, Card[]>();
  for (const k of karten) {
    let liste = nachEdition.get(k.editionKuerzel);
    if (!liste) nachEdition.set(k.editionKuerzel, (liste = []));
    liste.push(k);
  }

  return editionen
    .map((edition) => {
      const setKarten = nachEdition.get(edition.kuerzel) ?? [];
      if (setKarten.length === 0) return null;

      const speziesImSet = new Set<number>();
      const speziesBesessenImSet = new Set<number>();
      const cuSpezies = new Set<number>();
      const cuSpeziesFehlendSet = new Set<number>();
      let kartenBesessen = 0;

      const proRang = new Map<
        number,
        EditionSeltenheitZeile & { _spezies: Set<number> }
      >();

      for (const k of setKarten) {
        if (besitz.has(k.id)) kartenBesessen += 1;
        for (const d of speziesEinerKarte(k)) {
          speziesImSet.add(d);
          if (besessen.has(d)) speziesBesessenImSet.add(d);
        }
        if (!k.seltenheitDe) continue;
        const rarity = rangMap.get(k.seltenheitDe);
        if (!rarity || rarity.rang <= 0) continue;

        if (HAEUFIGE_RAENGE.has(rarity.rang)) {
          for (const d of speziesEinerKarte(k)) {
            cuSpezies.add(d);
            if (!besessen.has(d)) cuSpeziesFehlendSet.add(d);
          }
        }

        let zeile = proRang.get(rarity.rang);
        if (!zeile) {
          proRang.set(
            rarity.rang,
            (zeile = {
              seltenheit: rarity.de,
              rang: rarity.rang,
              farbe: rarity.farbe,
              kartenGesamt: 0,
              kartenBesessen: 0,
              kartenFehlend: 0,
              fehlendeSpeziesZiehbar: 0,
              _spezies: new Set()
            })
          );
        }
        zeile.kartenGesamt += 1;
        if (besitz.has(k.id)) zeile.kartenBesessen += 1;
        else zeile.kartenFehlend += 1;
        for (const d of speziesEinerKarte(k)) {
          if (!besessen.has(d)) zeile._spezies.add(d);
        }
      }

      const proSeltenheit: EditionSeltenheitZeile[] = [...proRang.values()]
        .map((z) => ({
          seltenheit: z.seltenheit,
          rang: z.rang,
          farbe: z.farbe,
          kartenGesamt: z.kartenGesamt,
          kartenBesessen: z.kartenBesessen,
          kartenFehlend: z.kartenFehlend,
          fehlendeSpeziesZiehbar: z._spezies.size
        }))
        .sort((a, b) => a.rang - b.rang);

      const cuSpeziesGesamt = cuSpezies.size;
      const cuSpeziesFehlend = cuSpeziesFehlendSet.size;
      const { ampel, empfehlung } = ampelUndText(proSeltenheit, cuSpeziesGesamt, cuSpeziesFehlend);
      const neueKarten = boosterNeueKarten(
        setKarten,
        rangMap,
        besessen,
        boosterModell(edition.serie)
      );

      return {
        edition,
        kartenGesamt: setKarten.length,
        kartenBesessen,
        speziesImSet: speziesImSet.size,
        speziesBesessenImSet: speziesBesessenImSet.size,
        fehlendeSpeziesZiehbarGesamt: proSeltenheit.reduce(
          (n, z) => n + z.fehlendeSpeziesZiehbar,
          0
        ),
        cuSpeziesGesamt,
        cuSpeziesFehlend,
        neuesPokemonChance: neueKarten.pMindestens[1] ?? 0,
        neueKartenErwartung: neueKarten.erwartung,
        neueKartenPMindestens: neueKarten.pMindestens,
        proSeltenheit,
        ampel,
        empfehlung
      } satisfies EditionAnalyse;
    })
    .filter((a): a is EditionAnalyse => a !== null);
}

/** Alle besessenen Karten (aus dem Datensatz), sortiert nach Edition/Nummer. */
export function besesseneKarten(karten: readonly Card[], besitz: ReadonlySet<string>): Card[] {
  return karten
    .filter((k) => besitz.has(k.id))
    .sort(
      (a, b) =>
        a.editionKuerzel.localeCompare(b.editionKuerzel) ||
        a.nummer.localeCompare(b.nummer, undefined, { numeric: true })
    );
}

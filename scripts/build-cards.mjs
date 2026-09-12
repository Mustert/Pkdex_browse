#!/usr/bin/env node
/**
 * Erzeugt static/data/editions.json und static/data/cards.json aus TCGdex
 * (api.tcgdex.net, deutschsprachiger Client via @tcgdex/sdk).
 *
 * Gesteuert von scripts/data/sets.json:
 *   - "serien"    TCGdex-Serien-IDs, die nach Sets durchsucht werden
 *   - "editionen" offizielle Set-Kuerzel (z. B. "SVI") in Anzeige-Reihenfolge
 *
 * Nutzung:
 *   node scripts/build-cards.mjs                 # alle Editionen aus sets.json
 *   node scripts/build-cards.mjs --edition=POR   # nur eine Edition (Test)
 *   node scripts/build-cards.mjs --fresh         # API-Cache unter scripts/.cache/ ignorieren
 *
 * Pro Edition:
 *   1. Set anhand des offiziellen Kuerzels (TCGdex-Feld set.abbreviation.official) finden.
 *   2. Kartenliste des Sets holen (Nummer, Name, Bild).
 *   3. Je Karte die Details holen (Seltenheit, Kategorie, National-Dex-Nummer).
 *   4. dexIds nur fuer Karten der Kategorie "Pokémon" - Trainer-/Energie-Karten
 *      koennen im Namen wie ein Pokemon klingen ("Relaxo-Puppe" ist eine Item-Karte).
 *
 * Seltenheits-Text -> kanonische deutsche Bezeichnung: ueber das Feld "tcgdex"
 * in static/data/rarities.json. Unbekannte Werte werden gemeldet.
 *
 * Braucht Node >= 18 und eine erreichbare TCGdex-API.
 */

import { readFile } from 'node:fs/promises';
import TCGdex from '@tcgdex/sdk';
import { createCache, mapLimit, writeJson } from './lib/util.mjs';

const tcgdex = new TCGdex('de');
const CONCURRENCY = 8;

const SETS_FILE = new URL('./data/sets.json', import.meta.url);
const RARITIES_FILE = new URL('../static/data/rarities.json', import.meta.url);
const EDITIONS_OUT = new URL('../static/data/editions.json', import.meta.url);
const CARDS_OUT = new URL('../static/data/cards.json', import.meta.url);
const CACHE_DIR = new URL('./.cache/tcgdex/', import.meta.url);

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const ONLY = args.find((a) => a.startsWith('--edition='))?.split('=')[1]?.toUpperCase();

main().catch((err) => {
  console.error('\nFehlgeschlagen:', err.message);
  process.exit(1);
});

async function main() {
  const cached = await createCache(CACHE_DIR, { fresh: FRESH });
  const { serien, editionen: kuerzelListe } = JSON.parse(await readFile(SETS_FILE, 'utf8'));
  const { seltenheiten } = JSON.parse(await readFile(RARITIES_FILE, 'utf8'));
  // "tcgdex" darf ein String oder eine Liste sein: mehrere TCGdex-Seltenheits-
  // Strings koennen auf dieselbe kanonische Bezeichnung zeigen (z. B. buendelt
  // "besonders selten" die V/VMAX/VSTAR/Secret-Grade der Schwert-&-Schild-Serie).
  const seltenheitByTcgdex = new Map();
  for (const r of seltenheiten) {
    if (!r.tcgdex) continue;
    for (const key of Array.isArray(r.tcgdex) ? r.tcgdex : [r.tcgdex]) {
      seltenheitByTcgdex.set(key, r.de);
    }
  }

  console.log(`TCGdex-Sets der Serien [${serien.join(', ')}] laden …`);
  const setsByKuerzel = await ladeSets(serien, cached);

  const gewuenscht = ONLY ? kuerzelListe.filter((k) => k === ONLY) : kuerzelListe;
  if (ONLY && gewuenscht.length === 0) throw new Error(`Kuerzel nicht in sets.json: ${ONLY}`);

  const editionen = [];
  const karten = [];

  for (const kuerzel of gewuenscht) {
    const set = setsByKuerzel.get(kuerzel);
    if (!set) {
      console.warn(`  ${kuerzel}: kein TCGdex-Set mit diesem Kuerzel gefunden - uebersprungen.`);
      continue;
    }

    editionen.push({
      kuerzel,
      name: editionsName(set),
      serie: set.serie?.name ?? '',
      erscheinungsdatum: set.releaseDate?.replace(/\//g, '-') ?? null,
      anzahlKarten: set.cardCount?.total ?? set.cards.length
    });

    process.stdout.write(`  ${kuerzel} (${set.cards.length} Karten) `);
    let done = 0;
    const details = await mapLimit(set.cards, CONCURRENCY, async (karte) => {
      const detail = await cached(`card-${karte.id}`, () => tcgdex.fetch('cards', karte.id));
      if (++done % 25 === 0 || done === set.cards.length) process.stdout.write('.');
      return detail;
    });
    process.stdout.write('\n');

    for (const detail of details) {
      if (!detail) continue;
      const nummer = normalisiereNummer(detail.localId);
      const bild = bildUrl(set, detail);
      const seltenheitDe = detail.rarity ? (seltenheitByTcgdex.get(detail.rarity) ?? null) : null;
      if (detail.rarity && !seltenheitDe) {
        console.warn(
          `    ${kuerzel}-${nummer}: unbekannte Seltenheit "${detail.rarity}" - static/data/rarities.json (Feld "tcgdex") ergaenzen.`
        );
      }
      karten.push({
        id: `${kuerzel}-${nummer}`,
        editionKuerzel: kuerzel,
        nummer,
        name: detail.name,
        seltenheitDe,
        dexIds: detail.category === 'Pokémon' ? (detail.dexId ?? []) : [],
        bild
      });
    }
  }

  karten.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const erzeugt = new Date().toISOString();
  await writeJson(EDITIONS_OUT, {
    _meta: { quelle: 'TCGdex (api.tcgdex.net), gesteuert von scripts/data/sets.json', erzeugt },
    editionen
  });
  await writeJson(CARDS_OUT, {
    _meta: { quelle: 'TCGdex (api.tcgdex.net), deutschsprachiger Client', erzeugt },
    karten
  });

  console.log(
    `\nGeschrieben: static/data/editions.json (${editionen.length} Editionen), ` +
      `static/data/cards.json (${karten.length} Karten)`
  );
}

/** Holt alle Sets der genannten Serien und indiziert sie nach abbreviation.official. */
async function ladeSets(serienIds, cached) {
  const byKuerzel = new Map();
  for (const serieId of serienIds) {
    const serie = await cached(`serie-${serieId}`, () => tcgdex.fetch('series', serieId));
    if (!serie) {
      console.warn(`  Serie "${serieId}" nicht gefunden.`);
      continue;
    }
    const sets = await mapLimit(serie.sets, CONCURRENCY, (ref) =>
      cached(`set-${ref.id}`, () => tcgdex.fetch('sets', ref.id))
    );
    for (const set of sets) {
      const kuerzel = set?.abbreviation?.official;
      if (kuerzel) byKuerzel.set(kuerzel.toUpperCase(), set);
    }
  }
  return byKuerzel;
}

/**
 * Anzeigename der Edition: Serienname voranstellen, wenn das Set anders heisst
 * ("Mega-Entwicklung" + "Erhabene Helden" -> "Mega-Entwicklung – Erhabene Helden";
 * "Karmesin & Purpur" == "Karmesin & Purpur" -> ohne Praefix).
 */
function editionsName(set) {
  const serie = set.serie?.name;
  if (!serie || serie === set.name) return set.name;
  return `${serie} – ${set.name}`;
}

/**
 * Bild-URL (hohe Aufloesung) einer Karte.
 *
 * Normalfall: TCGdex liefert `detail.image` als Basis, `/high.png` anhaengen.
 * Ausnahme Trainer-/Galar-Galerie (Set-ID endet auf "tg"/"gg"): dort fuellt
 * TCGdex kein `image`-Feld, obwohl die Assets existieren - sie liegen unter dem
 * ELTERN-Set (swsh9tg -> swsh9, swsh12.5gg -> swsh12.5). URL daraus zusammensetzen.
 */
function bildUrl(set, detail) {
  if (detail.image) return `${detail.image}/high.png`;
  const serieId = set.serie?.id;
  if (serieId && /(?:tg|gg)$/i.test(set.id)) {
    const elternSet = set.id.replace(/(?:tg|gg)$/i, '');
    return `https://assets.tcgdex.net/de/${serieId}/${elternSet}/${detail.localId}/high.png`;
  }
  return null;
}

/** "1" -> "001", "TG05" bleibt "TG05". */
function normalisiereNummer(localId) {
  const s = String(localId);
  return /^\d+$/.test(s) ? s.padStart(3, '0') : s;
}

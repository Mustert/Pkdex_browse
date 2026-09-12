#!/usr/bin/env node
/**
 * Erzeugt static/data/pokedex.json aus der PokeAPI (REST v2, pokeapi.co):
 * je Spezies der National-Dex Name, Typ, Gattung, Generation, Sprite/Artwork
 * und ein Pokedex-Text - jeweils Deutsch und Englisch.
 *
 * Nutzung:
 *   node scripts/build-pokedex.mjs               # ganze National-Dex (dauert 1-3 min)
 *   node scripts/build-pokedex.mjs --limit=151   # nur die ersten 151 (schneller Test)
 *   node scripts/build-pokedex.mjs --fresh       # HTTP-Cache unter scripts/.cache/ ignorieren
 *
 * Braucht Node >= 18 (globales fetch).
 */

import { createCache, mapLimit, numArg, writeJson } from './lib/util.mjs';

const API = 'https://pokeapi.co/api/v2';
const CONCURRENCY = 10;
const MAX_RETRY = 4;

const CACHE_DIR = new URL('./.cache/', import.meta.url);
const OUT_FILE = new URL('../static/data/pokedex.json', import.meta.url);

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const LIMIT = numArg(args, '--limit') ?? Infinity;

const GENERATION_NR = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9
};

let fetchJson;

main().catch((err) => {
  console.error('\nFehlgeschlagen:', err.message);
  process.exit(1);
});

async function main() {
  const cache = await createCache(CACHE_DIR, { fresh: FRESH });
  fetchJson = (url) => cache(url, () => httpJson(url));

  console.log('Typ-Namen laden …');
  const typDe = await ladeTypNamen();

  console.log('Spezies-Liste laden …');
  const { results } = await fetchJson(`${API}/pokemon-species?limit=100000`);
  const liste = Number.isFinite(LIMIT) ? results.slice(0, LIMIT) : results;
  console.log(`${liste.length} Spezies werden verarbeitet.`);

  let done = 0;
  const eintraege = await mapLimit(liste, CONCURRENCY, async (ref) => {
    const eintrag = await baueEintrag(ref.url, typDe);
    if (++done % 50 === 0 || done === liste.length) process.stdout.write(`\r  ${done}/${liste.length}`);
    return eintrag;
  });
  process.stdout.write('\n');

  const pokemon = eintraege.filter(Boolean).sort((a, b) => a.id - b.id);
  await writeJson(OUT_FILE, {
    _meta: { quelle: 'PokeAPI (pokeapi.co) REST v2', erzeugt: new Date().toISOString(), anzahl: pokemon.length },
    pokemon
  });
  console.log(`Geschrieben: static/data/pokedex.json (${pokemon.length} Eintraege)`);
}

async function baueEintrag(speciesUrl, typDe) {
  const s = await fetchJson(speciesUrl);
  if (!s) return null;

  const standardform = s.varieties?.find((v) => v.is_default) ?? s.varieties?.[0];
  const mon = standardform?.pokemon?.url
    ? await fetchJson(standardform.pokemon.url).catch(() => null)
    : null;

  const typen = (mon?.types ?? [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);

  return {
    id: s.id,
    name: { de: name(s.names, 'de') ?? cap(s.name), en: name(s.names, 'en') ?? cap(s.name) },
    genus: { de: genus(s.genera, 'de'), en: genus(s.genera, 'en') },
    generation: GENERATION_NR[s.generation?.name] ?? 0,
    types: typen,
    typesDe: typen.map((t) => typDe[t] ?? cap(t)),
    color: s.color?.name ?? null,
    sprite: mon?.sprites?.front_default ?? null,
    artwork: mon?.sprites?.other?.['official-artwork']?.front_default ?? null,
    flavorText: { de: flavor(s.flavor_text_entries, 'de'), en: flavor(s.flavor_text_entries, 'en') },
    evolvesFromId: s.evolves_from_species ? idAusUrl(s.evolves_from_species.url) : null,
    istLegendaer: Boolean(s.is_legendary),
    istMysterioes: Boolean(s.is_mythical),
    istBaby: Boolean(s.is_baby),
    formen: (s.varieties ?? []).filter((v) => !v.is_default).map((v) => v.pokemon.name)
  };
}

async function ladeTypNamen() {
  const { results } = await fetchJson(`${API}/type?limit=100`);
  const map = {};
  await mapLimit(results, CONCURRENCY, async (ref) => {
    const t = await fetchJson(ref.url);
    map[t.name] = name(t.names, 'de') ?? cap(t.name);
  });
  return map;
}

/* ---------- Helfer ---------- */

const name = (names, lang) => names?.find((n) => n.language?.name === lang)?.name;
const genus = (genera, lang) => genera?.find((g) => g.language?.name === lang)?.genus ?? '';

function flavor(entries, lang) {
  const raw = entries?.find((e) => e.language?.name === lang)?.flavor_text;
  return raw ? raw.replace(/[\n\f\r­]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : '';
}

function idAusUrl(url) {
  const m = String(url).match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET mit Retry/Backoff. 404 -> null. Das Cachen uebernimmt createCache. */
async function httpJson(url) {
  for (let versuch = 1; ; versuch++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (versuch >= MAX_RETRY) throw new Error(`${url}\n  -> ${err.message}`);
      await sleep(600 * versuch);
    }
  }
}

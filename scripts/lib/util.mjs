/**
 * Gemeinsame Helfer fuer die Build-Skripte (build-pokedex.mjs, build-cards.mjs).
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Liest `--flag=wert` oder `--flag wert` aus argv; gibt die Zahl oder undefined. */
export function numArg(argv, flag) {
  const hit = argv.find((a) => a === flag || a.startsWith(`${flag}=`));
  if (!hit) return undefined;
  const raw = hit.includes('=') ? hit.split('=')[1] : argv[argv.indexOf(hit) + 1];
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Wie Promise.all(items.map(fn)), aber mit hoechstens `limit` gleichzeitigen Aufrufen. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Legt einen Datei-Cache unter `dir` an. Die zurueckgegebene Funktion
 * `cached(key, fn)` liefert bei einem Treffer den gespeicherten Wert, sonst das
 * Ergebnis von `fn()` (und legt es ab). Mit `fresh: true` wird der Cache ignoriert.
 *
 * Zweck: Wiederholungslaeufe sind schnell und die APIs werden geschont.
 */
export async function createCache(dir, { fresh = false } = {}) {
  await mkdir(dir, { recursive: true });

  return async function cached(key, fn) {
    const file = new URL(createHash('sha1').update(key).digest('hex') + '.json', dir);
    if (!fresh && existsSync(file)) {
      try {
        return JSON.parse(await readFile(file, 'utf8'));
      } catch {
        // beschaedigter Cache-Eintrag -> neu holen
      }
    }
    const value = await fn();
    await writeFile(file, JSON.stringify(value ?? null), 'utf8');
    return value;
  };
}

/** Schreibt ein Objekt als eingerücktes JSON (mit abschliessendem Zeilenumbruch). */
export async function writeJson(fileUrl, data) {
  await mkdir(new URL('.', fileUrl), { recursive: true });
  await writeFile(fileUrl, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

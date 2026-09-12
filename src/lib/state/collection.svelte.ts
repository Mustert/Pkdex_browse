import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Zentraler Sammler-Zustand – die eine Karten-Sammlung des Nutzers.
 *
 * Modell: besitzt / besitzt-nicht (ein `Set` von Karten-IDs, keine Stückzahlen).
 * Persistenz: `localStorage` (kein Backend). Deshalb Export/Import als JSON
 * in der Sammlungs-Ansicht – Cache leeren würde sonst alles löschen.
 *
 * Reiner Singleton (kein Factory wie bei den Filter-States): es gibt genau
 * eine Sammlung, und `CardGrid` / `RarityMatrixTable` greifen direkt zu,
 * ohne dass jede Route den Zustand durchreichen muss.
 */

const KEY_OWNED = 'pokellector:owned:v1';
const KEY_MODE = 'pokellector:mode:v1';
const KEY_SETTINGS = 'pokellector:settings:v1';

export const DEFAULT_COLLECTION_COLOR = '#22a06b';

export interface CollectionSettings {
  /** Highlight-Farbe für besessene Karten/Badges im Sammlermodus. */
  color: string;
  /** Sound beim Hinzufügen abspielen. */
  sound: boolean;
}

export interface CollectionExport {
  _format: 'pokellector-collection';
  version: 1;
  exportiert: string;
  karten: string[];
}

function readOwned(): string[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(KEY_OWNED);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function readSettings(): CollectionSettings {
  const fallback: CollectionSettings = { color: DEFAULT_COLLECTION_COLOR, sound: true };
  if (!browser) return fallback;
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<CollectionSettings>;
    return {
      color: typeof parsed.color === 'string' ? parsed.color : fallback.color,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : fallback.sound
    };
  } catch {
    return fallback;
  }
}

const owned = new SvelteSet<string>(readOwned());
let collectorMode = $state(browser && localStorage.getItem(KEY_MODE) === '1');
let settings = $state<CollectionSettings>(readSettings());

function persistOwned(): void {
  if (browser) localStorage.setItem(KEY_OWNED, JSON.stringify([...owned]));
}

function persistSettings(): void {
  if (browser) localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

export const collection = {
  /** Sammlermodus aktiv? (Klick sammelt statt zu navigieren.) */
  get collectorMode(): boolean {
    return collectorMode;
  },
  set collectorMode(value: boolean) {
    collectorMode = value;
    if (browser) localStorage.setItem(KEY_MODE, value ? '1' : '0');
  },
  toggleMode(): void {
    this.collectorMode = !collectorMode;
  },

  get settings(): CollectionSettings {
    return settings;
  },
  set color(value: string) {
    settings = { ...settings, color: value };
    persistSettings();
  },
  set sound(value: boolean) {
    settings = { ...settings, sound: value };
    persistSettings();
  },

  /** Anzahl verschiedener Karten in der Sammlung. */
  get size(): number {
    return owned.size;
  },
  /** Alle Karten-IDs (für Analyse/Export). */
  get ids(): ReadonlySet<string> {
    return owned;
  },
  has(id: string): boolean {
    return owned.has(id);
  },

  /** Karte aufnehmen. Gibt `true` zurück, wenn sie vorher nicht enthalten war. */
  add(id: string): boolean {
    if (owned.has(id)) return false;
    owned.add(id);
    persistOwned();
    return true;
  },
  remove(id: string): boolean {
    if (!owned.delete(id)) return false;
    persistOwned();
    return true;
  },
  /** Für Modifier-Klick: `remove` steuert die Richtung. Gibt `'added' | 'removed' | null`. */
  apply(id: string, remove: boolean): 'added' | 'removed' | null {
    if (remove) return this.remove(id) ? 'removed' : null;
    return this.add(id) ? 'added' : null;
  },
  clear(): void {
    owned.clear();
    persistOwned();
  },

  toExport(): CollectionExport {
    return {
      _format: 'pokellector-collection',
      version: 1,
      exportiert: new Date().toISOString(),
      karten: [...owned].sort()
    };
  },
  /**
   * Import ersetzt die komplette Sammlung. Wirft bei ungültigem Format.
   * Gibt die Anzahl importierter Karten zurück.
   */
  fromImport(data: unknown): number {
    const obj = data as Partial<CollectionExport> | null;
    if (!obj || obj._format !== 'pokellector-collection' || !Array.isArray(obj.karten)) {
      throw new Error('Kein gültiger Pokéllector-Sammlungs-Export.');
    }
    const ids = obj.karten.filter((x): x is string => typeof x === 'string');
    owned.clear();
    for (const id of ids) owned.add(id);
    persistOwned();
    return owned.size;
  }
};

/** Zweisprachiger Text (Deutsch / Englisch). */
export interface LocalizedText {
  de: string;
  en: string;
}

/** Ein Eintrag im Pokedex (eine Spezies der National-Dex). */
export interface PokedexEntry {
  /** National-Dex-Nummer. */
  id: number;
  name: LocalizedText;
  /** Gattung, z. B. "Samen-Pokémon" / "Seed Pokémon". */
  genus: LocalizedText;
  /** Generation als Zahl (1–9). */
  generation: number;
  /** Typ-Slugs in Slot-Reihenfolge, z. B. ["grass", "poison"]. */
  types: string[];
  /** Dieselben Typen auf Deutsch, z. B. ["Pflanze", "Gift"]. */
  typesDe: string[];
  /** Farbe laut PokeAPI (Slug), z. B. "green". */
  color: string | null;
  /** Pixel-Sprite (klein), URL oder null. */
  sprite: string | null;
  /** Offizielles Artwork (gross), URL oder null. */
  artwork: string | null;
  /** Ein repraesentativer Pokedex-Text. */
  flavorText: LocalizedText;
  /** National-Dex-Nummer der Vorentwicklung, sonst null. */
  evolvesFromId: number | null;
  istLegendaer: boolean;
  istMysterioes: boolean;
  istBaby: boolean;
  /** Slugs alternativer Formen (nicht die Standardform). */
  formen: string[];
}

export interface PokedexFile {
  _meta: {
    quelle: string;
    erzeugt: string;
    anzahl: number;
  };
  pokemon: PokedexEntry[];
}

/** Eine TCG-Edition / Erweiterung. */
export interface Edition {
  /** Anzeigename, z. B. "Karmesin & Purpur – Paradoxrift". */
  name: string;
  /** ISO 8601, JJJJ-MM-TT. */
  erscheinungsdatum: string;
  /** Offizielles Set-Kuerzel, z. B. "SVI". */
  kuerzel: string;
  /** Hoechste Kartennummer inkl. Secret Rares. */
  anzahlKarten: number;
  /** Serienname, z. B. "Karmesin & Purpur". */
  serie: string;
}

export interface EditionsFile {
  _meta?: unknown;
  editionen: Edition[];
}

/** Ein Seltenheitsgrad (aus rarities.json). */
export interface Rarity {
  /** Kanonische deutsche Bezeichnung – dient als Schluessel. */
  de: string;
  en: string;
  abk: string | null;
  kategorie: 'grundlegend' | 'sv' | 'spezial' | 'druckvariante';
  /** Grobe Einordnung nach Seltenheit; 0 = Druckvariante. */
  rang: number;
  symbol: string;
  glyph: string | null;
  farbe: string | null;
  pokemontcgIo: string | null;
  /** Zugehoerige(r) TCGdex-rarity-String(s). Liste = mehrere Grade unter einem Oberbegriff. */
  tcgdex: string | string[] | null;
  abEdition: string;
  hinweis: string | null;
}

export interface RaritiesFile {
  _meta?: unknown;
  seltenheiten: Rarity[];
}

/** Eine einzelne Sammelkarte. */
export interface Card {
  /** Eindeutige ID, z. B. "SVI-001". */
  id: string;
  /** Set-Kuerzel, referenziert Edition.kuerzel. */
  editionKuerzel: string;
  /** Kartennummer im Set, z. B. "001" oder "TG05". */
  nummer: string;
  /** Kartenname (Deutsch), z. B. "Bisasam" oder "Glurak-ex". */
  name: string;
  /** Kanonische deutsche Seltenheit, referenziert Rarity.de. Null wenn unbekannt. */
  seltenheitDe: string | null;
  /** National-Dex-Nummern der abgebildeten Pokemon (meist genau eine). Leer bei Trainer-/Energie-Karten. */
  dexIds: number[];
  /** Bild-URL (grosse Aufloesung), oder null wenn keins verfuegbar. */
  bild: string | null;
}

export interface CardsFile {
  _meta?: unknown;
  karten: Card[];
}

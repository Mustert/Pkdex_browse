# Pokéllector

Ein Browser für Pokémon-Sammelkarten, aufgehängt am Pokédex. Statt Karten nach
Editionen zu durchsuchen, geht man vom Pokémon aus: „Von welchem Pokémon gibt es
welche Karten, in welcher Seltenheit, und welche davon habe ich schon?“

Die App läuft komplett im Browser (kein Server, keine Anmeldung). Die eigene
Sammlung wird lokal im Browser gespeichert.

## Was die App kann

| Ansicht | Nutzen |
|---------|--------|
| **Pokédex** (Startseite) | Alle Pokémon der National-Dex als Tabelle Pokémon × Seltenheit. Zeigt auf einen Blick, von wem es welche Karten gibt. Suche nach Name/Nummer, Filter nach Generation, optional nur Pokémon mit Karten. |
| **Karten** | Alle erfassten Karten, nach Edition gruppiert und aufklappbar. Suche nach Kartenname, Filter nach Edition. |
| **Pokémon-Detail** | Kurzinfo, Pokédex-Text und alle Sammelkarten dieses Pokémon. |
| **Meine Sammlung** | Fortschritt zum kompletten Pokédex, dazu die Auswertung „Lohnt sich noch ein Booster dieser Edition, oder ziehe ich nur noch Dubletten?“. Export/Import der Sammlung als JSON. |

### Sammlermodus

Oben rechts sitzt der Schalter **Sammlermodus**. Ist er an, legt ein Klick auf
eine Karte diese in die Sammlung, statt zur Kartenseite zu navigieren. Alt-Klick
oder Rechtsklick nimmt sie wieder heraus. Die Sammlung merkt sich nur
*besitzt / besitzt nicht* (keine Stückzahlen) und liegt ausschließlich im
`localStorage` dieses Browsers – deshalb der Export in „Meine Sammlung“.

## Schnellstart

Voraussetzung: Node ≥ 18.17.

```bash
npm install
npm run pokedex     # static/data/pokedex.json aus der PokeAPI erzeugen (einmalig, 1–3 min)
npm run cards       # static/data/editions.json + cards.json aus TCGdex erzeugen
npm run dev         # Entwicklungsserver auf http://localhost:5173
```

`pokedex.json`, `editions.json` und `cards.json` liegen bereits im Repo. `npm run
pokedex` / `npm run cards` sind nur nötig, um die Daten zu aktualisieren – etwa
wenn eine neue Edition erscheint.

## Eine Edition hinzufügen (neu oder alt)

Alle Karten- und Editionsdaten kommen aus **[TCGdex](https://tcgdex.dev)**. Welche
Editionen die App zeigt, steht in **`scripts/data/sets.json`**:

```json
{
  "serien": ["sv", "me"],
  "editionen": ["SVI", "PAL", "OBF", "…", "PBL"]
}
```

* `editionen` – die offiziellen Set-Kürzel (`SVI`, `PAL`, …) in genau der
  Reihenfolge, in der sie in der App erscheinen sollen.
* `serien` – die TCGdex-Serien, die nach diesen Sets durchsucht werden.

**Schritte:**

1. Das Kürzel der Edition an die passende Stelle in `editionen` eintragen.
2. Stammt die Edition aus einer älteren Serie, deren Serien-ID zu `serien`
   ergänzen. Verfügbare Serien-IDs: `base`, `neo`, `ecard`, `ex`, `dp`, `pl`,
   `hgss`, `col`, `bw`, `xy`, `sm`, `swsh`, `sv`, `tcgp`, `me`.
3. `npm run cards` ausführen.

Das Skript schreibt `static/data/editions.json` (Name, Serie, Datum, Kartenzahl –
alles aus TCGdex) und `static/data/cards.json` (jede Karte mit Nummer, deutschem
Namen, Seltenheit, National-Dex-Nummer und Bild-URL) neu. Danach ist die Edition
in allen Ansichten sichtbar.

Optionen:

```bash
npm run cards -- --edition=POR   # nur eine Edition neu bauen (schneller Test)
npm run cards -- --fresh         # TCGdex-Cache unter scripts/.cache/ ignorieren
```

### Warum nur die API und keine PDFs?

Frühere Versionen lasen zusätzlich die offiziellen „web cardlist“-PDFs von
pokemon.de ein. Das ist nicht mehr nötig: Der deutschsprachige TCGdex-Client
liefert Kartennummer, deutschen Namen, Seltenheit, National-Dex-Nummer und Bild
in einem Rutsch, und über das Feld `abbreviation.official` lässt sich jedes Set
direkt seinem Kürzel zuordnen. Der einzige Unterschied: TCGdex führt bei einigen
Trainerkarten den Klammerzusatz nicht mit (z. B. „Forschung des Professors“ statt
„Forschung des Professors (Prof. Antiqua)“). Für einen Pokédex-Browser ist das
ohne Belang, und der Gewinn an Einfachheit überwiegt deutlich.

## Woher die Daten kommen

Die App lädt zur Laufzeit vier JSON-Dateien aus `static/data/`:

| Datei | Inhalt | Erzeugt / gepflegt durch |
|-------|--------|--------------------------|
| `pokedex.json` | National-Dex: Name, Typ, Gattung, Generation, Artwork, Pokédex-Text (DE/EN) | `npm run pokedex` – [PokeAPI](https://pokeapi.co) |
| `editions.json` | Editionen: Kürzel, Name, Serie, Erscheinungsdatum, Kartenzahl | `npm run cards` – [TCGdex](https://tcgdex.dev) |
| `cards.json` | Jede Karte: ID, Edition, Nummer, Name, Seltenheit, abgebildete Pokémon, Bild-URL | `npm run cards` – [TCGdex](https://tcgdex.dev) |
| `rarities.json` | Nachschlagetabelle der Seltenheitsgrade (deutsche Bezeichnung, Rang, Symbol) | von Hand |

Beide Build-Skripte legen ihre HTTP-Antworten unter `scripts/.cache/` ab, damit
wiederholte Läufe schnell sind und die APIs geschont werden. Der Ordner wird
nicht eingecheckt; `--fresh` erzwingt ein Neuladen.

`npm run pokedex` akzeptiert zusätzlich `--limit=N` (nur die ersten N Spezies):

```bash
node scripts/build-pokedex.mjs --limit=151 --fresh
```

## Alle Befehle

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build nach `build/` |
| `npm run preview` | Produktions-Build lokal testen |
| `npm run check` | Svelte-/TypeScript-Typecheck |
| `npm run test` | Vitest (reine Logik unter `src/lib/`) |
| `npm run pokedex` | `static/data/pokedex.json` neu erzeugen |
| `npm run cards` | `static/data/editions.json` + `cards.json` neu erzeugen |

## Projektaufbau

Getrennt nach Verantwortung: Datenzugriff, reine Logik, Präsentation, Routen.

```
scripts/
  build-pokedex.mjs        pokedex.json aus der PokeAPI
  build-cards.mjs          editions.json + cards.json aus TCGdex
  lib/util.mjs             gemeinsame Helfer (Cache, Nebenläufigkeit)
  data/sets.json           Steuerdatei: welche Editionen die App zeigt

src/lib/
  data/                    JSON laden und cachen, plus die TypeScript-Typen
  pokedex/                 Filter und Formatierung für den Pokédex (Vitest-testbar)
  cards/                   Karten filtern, sortieren, zur Pokémon×Seltenheit-Tabelle verrechnen
  collection/analyse.ts    Sammlungs-Auswertung und Booster-Empfehlung (Vitest-testbar)
  components/              geteilte, präsentationale Komponenten
  state/                   Filter-State (in der URL) und die Sammlung (im localStorage)
  styles.css               globale Design-Tokens, Light/Dark

src/routes/
  +layout.svelte           App-Rahmen: Topbar, Navigation, Sammlermodus-Schalter
  +page.svelte             Pokédex-Übersicht
  pokemon/[id]/            Pokémon-Detailseite
  karten/                  Kartenliste nach Edition
  karte/[id]/              einzelne Kartenseite
  sammlung/                „Meine Sammlung“
```

Faustregel: Routen orchestrieren nur. Logik gehört als reine Funktion nach
`src/lib/` und wird dort mit Vitest getestet. Nur an einer Stelle genutzte
Komponenten liegen neben ihrer Route, `src/lib/components/` ist für echt Geteiltes.

## Build & Veröffentlichung

`npm run build` erzeugt einen rein statischen Ordner `build/`, der auf jedem
Static-Hosting läuft. Läuft die Seite nicht unter der Domain-Wurzel, sondern
unter einem Unterpfad, beim Build `BASE_PATH` setzen:

```bash
BASE_PATH=/pkdex-tcg-browse npm run build
```

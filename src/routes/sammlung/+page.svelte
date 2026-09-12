<script lang="ts">
  import { browser } from '$app/environment';
  import CardGrid from '$lib/components/CardGrid.svelte';
  import RaritySymbol from '$lib/components/RaritySymbol.svelte';
  import { dexNumber } from '$lib/pokedex/format';
  import { collection } from '$lib/state/collection.svelte';
  import {
    besessenNachSpezies,
    besesseneKarten,
    editionsAnalyse,
    ueberblick,
    type Ampel
  } from '$lib/collection/analyse';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const ids = $derived(collection.ids);

  const ub = $derived(ueberblick(data.karten, data.pokedex, ids));
  const proSpezies = $derived(besessenNachSpezies(data.karten, data.pokedex, ids));
  const editionen = $derived(editionsAnalyse(data.karten, data.editionen, data.rarities, ids));
  const meineKarten = $derived(besesseneKarten(data.karten, ids));

  const meineNachEdition = $derived(
    data.editionen
      .map((edition) => ({
        edition,
        karten: meineKarten.filter((k) => k.editionKuerzel === edition.kuerzel)
      }))
      .filter((g) => g.karten.length > 0)
  );

  const prozent = $derived(Math.round(ub.fortschritt * 100));
  const erreichbarProzent = $derived(Math.round(ub.erreichbar * 100));

  // --- Serien-Tabs (wie unter „Karten“): eine Auswahl-Card je Hauptserie. -----
  const serienNamen = $derived([...new Set(data.editionen.map((e) => e.serie))]);
  const serien = $derived(
    serienNamen.map((name) => ({
      name,
      anzahl: data.editionen.filter((e) => e.serie === name).length
    }))
  );

  const SERIE_KEY = 'pokellector:sammlung-serie:v1';

  function ladeSerie(): string {
    if (browser) {
      try {
        const s = sessionStorage.getItem(SERIE_KEY);
        if (s) return s;
      } catch {
        /* ignore */
      }
    }
    return data.editionen.at(-1)?.serie ?? '';
  }

  let gewaehlteSerie = $state(ladeSerie());
  const aktiveSerie = $derived(
    serienNamen.includes(gewaehlteSerie) ? gewaehlteSerie : (serienNamen.at(-1) ?? '')
  );

  function waehleSerie(name: string) {
    gewaehlteSerie = name;
    if (browser) {
      try {
        sessionStorage.setItem(SERIE_KEY, name);
      } catch {
        /* ignore */
      }
    }
  }

  const editionenDerSerie = $derived(editionen.filter((e) => e.edition.serie === aktiveSerie));

  const ampelText: Record<Ampel, string> = {
    gruen: 'über die Hälfte der häufigen/nicht so häufigen Pokémon fehlt noch',
    gelb: 'weniger als die Hälfte der häufigen/nicht so häufigen Pokémon fehlt noch',
    orange: 'nur noch in selteneren Karten etwas zu holen',
    rot: 'jedes Pokémon dieser Edition ist schon gesammelt'
  };

  const chanceProzent = (chance: number) => Math.round(chance * 100);
  const einsKomma = (n: number) => n.toFixed(1).replace('.', ',');
  const mindestensTooltip = (p: number[]) =>
    [1, 2, 3, 4, 5]
      .map((m) => `≥ ${m} neue Karten: ${chanceProzent(p[m] ?? 0)} %`)
      .join('\n');

  let importFehler = $state('');
  let importInfo = $state('');

  function exportieren() {
    const blob = new Blob([JSON.stringify(collection.toExport(), null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokellector-sammlung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importieren(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const anzahl = collection.fromImport(JSON.parse(await file.text()));
      importInfo = `${anzahl} Karten importiert.`;
      importFehler = '';
    } catch (err) {
      importFehler = err instanceof Error ? err.message : 'Import fehlgeschlagen.';
      importInfo = '';
    } finally {
      input.value = '';
    }
  }

  function leeren() {
    if (confirm('Wirklich die gesamte Sammlung löschen? Das lässt sich nicht rückgängig machen.')) {
      collection.clear();
    }
  }
</script>

<h1>Meine Sammlung</h1>

{#if collection.size === 0}
  <p class="muted intro">
    Deine Sammlung ist leer. Aktiviere oben rechts den <strong>Sammlermodus</strong> und klicke in
    der Karten- oder Pokédex-Ansicht auf Karten, um sie aufzunehmen. Oder importiere unten eine
    gesicherte Sammlung.
  </p>
{/if}

<!-- Überblick -->
<section class="block">
  <div class="stats">
    <div class="stat">
      <span class="zahl">{ub.kartenBesessen}</span>
      <span class="muted">Karten in der Sammlung</span>
    </div>
    <div class="stat">
      <span class="zahl">{ub.speziesBesessen}<span class="muted">&nbsp;/&nbsp;{ub.speziesGesamt}</span></span>
      <span class="muted">Pokémon gesammelt</span>
    </div>
    <div class="stat">
      <span class="zahl">{ub.speziesFehlend}</span>
      <span class="muted">fehlen zum kompletten Pokédex</span>
    </div>
  </div>
  <div
    class="bar"
    role="img"
    aria-label="Pokédex zu {prozent}% vervollständigt, mit den aktuellen Editionen wären {erreichbarProzent}% möglich"
  >
    <div class="ceiling" style="width: {erreichbarProzent}%"></div>
    <div class="fill" style="width: {prozent}%"></div>
  </div>
  <p class="muted small">
    Pokédex-Fortschritt: <strong>{prozent}%</strong> von {ub.speziesGesamt} Pokémon.
    {#if ub.speziesOhneKarte > 0}
      Mit den geladenen Editionen sind derzeit max. {erreichbarProzent}% erreichbar –
      {ub.speziesOhneKarte} Pokémon gibt es noch in keiner Edition als Karte. Das Maximalziel
      bleibt 1025 und wächst mit, wenn neue Editionen dazukommen.
    {/if}
  </p>
</section>

<!-- Lohnt sich ein Booster? -->
<section class="block">
  <h2>Lohnt sich noch ein Booster?</h2>
  <p class="muted small">
    Pro Edition: wie viele noch fehlende Pokémon du dort in welcher Seltenheit ziehen kannst, plus
    wie viele neue Karten ein Booster im Schnitt bringt (Ø). Mauszeiger über den Ø-Wert zeigt die
    Chancen auf ≥ 1 bis ≥ 5 neue Karten.
  </p>
  <p class="muted small legende">
    <span class="ampel gruen"></span> über die Hälfte der häufigen Pokémon fehlt noch ·
    <span class="ampel gelb"></span> weniger als die Hälfte ·
    <span class="ampel orange"></span> nur noch in selteneren Karten ·
    <span class="ampel rot"></span> alles gesammelt
  </p>

  <div class="serien" role="tablist" aria-label="Serie wählen">
    {#each serien as serie (serie.name)}
      <button
        type="button"
        role="tab"
        class="serie"
        class:aktiv={serie.name === aktiveSerie}
        aria-selected={serie.name === aktiveSerie}
        onclick={() => waehleSerie(serie.name)}
      >
        <span class="serie-name">{serie.name}</span>
        <span class="serie-meta muted">{serie.anzahl} Editionen</span>
      </button>
    {/each}
  </div>

  {#if editionenDerSerie.length === 0}
    <p class="muted">Für diese Serie sind keine Karten geladen.</p>
  {/if}

  {#each editionenDerSerie as e (e.edition.kuerzel)}
    <details class="gruppe">
      <summary>
        <span class="ampel {e.ampel}" title={ampelText[e.ampel]}></span>
        <span class="ed-name">{e.edition.name}</span>
        <span class="muted small">
          {e.kartenBesessen}/{e.kartenGesamt} Karten ·
          {e.fehlendeSpeziesZiehbarGesamt} fehlende Pokémon ziehbar
        </span>
        <span
          class="chance-chip"
          class:leer={e.neueKartenErwartung === 0}
          title={mindestensTooltip(e.neueKartenPMindestens)}
        >
          Ø&nbsp;{einsKomma(e.neueKartenErwartung)}&nbsp;neu
        </span>
      </summary>
      <p class="empfehlung">{e.empfehlung}</p>
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Seltenheit</th>
              <th scope="col">Karten</th>
              <th scope="col">hast du</th>
              <th scope="col">fehlen</th>
              <th scope="col">fehlende Pokémon<br />hier ziehbar</th>
            </tr>
          </thead>
          <tbody>
            {#each e.proSeltenheit as z (z.rang)}
              <tr>
                <th scope="row" class="links">
                  <RaritySymbol rang={z.rang} tooltip={z.seltenheit} />
                  {z.seltenheit}
                </th>
                <td>{z.kartenGesamt}</td>
                <td>{z.kartenBesessen}</td>
                <td>{z.kartenFehlend}</td>
                <td class:stark={z.fehlendeSpeziesZiehbar > 0}>{z.fehlendeSpeziesZiehbar}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="chance-zeile">
        <span class="schnitt">Ø {einsKomma(e.neueKartenErwartung)} neue Karten pro Booster</span>
        {#each [1, 2, 3, 4, 5] as m (m)}
          <span class="staffel">≥{m}&nbsp;{chanceProzent(e.neueKartenPMindestens[m] ?? 0)}%</span>
        {/each}
        {#if e.cuSpeziesGesamt > 0}
          <span class="muted">
            · häufig/nicht so häufig: {e.cuSpeziesFehlend}/{e.cuSpeziesGesamt} Pokémon offen
          </span>
        {/if}
      </p>
    </details>
  {/each}
</section>

<!-- Meine Karten -->
{#if meineKarten.length > 0}
  <section class="block">
    <h2>Meine Karten <span class="muted">({meineKarten.length})</span></h2>
    {#if collection.collectorMode}
      <p class="muted small">Alt-Klick oder Rechtsklick auf eine Karte entfernt sie wieder.</p>
    {/if}

    <details class="gruppe">
      <summary>Pokémon-Zählung ({proSpezies.length})</summary>
      <ul class="spezies">
        {#each proSpezies as z (z.pokemon.id)}
          <li>
            <span class="muted num">{dexNumber(z.pokemon.id)}</span>
            <span class="sp-name">{z.pokemon.name.de}</span>
            <span class="muted">{z.kartenBesessen} / {z.kartenGesamt} Karten</span>
          </li>
        {/each}
      </ul>
    </details>

    {#each meineNachEdition as gruppe (gruppe.edition.kuerzel)}
      <details class="gruppe">
        <summary>
          {gruppe.edition.name} <span class="muted small">({gruppe.karten.length})</span>
        </summary>
        <div class="grid-wrap">
          <CardGrid karten={gruppe.karten} />
        </div>
      </details>
    {/each}
  </section>
{/if}

<!-- Einstellungen / Sicherung -->
<section class="block">
  <h2>Einstellungen &amp; Sicherung</h2>
  <div class="settings">
    <label class="feld">
      <span>Sammlungsfarbe</span>
      <input
        type="color"
        value={collection.settings.color}
        oninput={(e) => (collection.color = e.currentTarget.value)}
      />
    </label>
    <label class="feld reihe">
      <input
        type="checkbox"
        checked={collection.settings.sound}
        onchange={(e) => (collection.sound = e.currentTarget.checked)}
      />
      <span>Sound beim Sammeln</span>
    </label>
  </div>

  <div class="aktionen">
    <button type="button" onclick={exportieren} disabled={collection.size === 0}>
      Sammlung exportieren (.json)
    </button>
    <label class="datei-btn">
      Sammlung importieren…
      <input type="file" accept="application/json,.json" onchange={importieren} />
    </label>
    <button type="button" class="gefahr" onclick={leeren} disabled={collection.size === 0}>
      Sammlung leeren
    </button>
  </div>
  {#if importInfo}<p class="ok small">{importInfo}</p>{/if}
  {#if importFehler}<p class="fehler small">{importFehler}</p>{/if}
  <p class="muted small">
    Die Sammlung liegt nur im Browser-Speicher dieses Geräts. Regelmäßig exportieren!
  </p>
</section>

<style>
  .intro {
    max-width: 60ch;
  }

  .block {
    margin: 1.75rem 0;
  }

  .block h2 {
    font-size: 1.15rem;
    margin: 0 0 0.4rem;
  }

  .small {
    font-size: 0.85rem;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    margin-bottom: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat .zahl {
    font-size: 1.7rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .stat .zahl .muted {
    font-size: 1rem;
    font-weight: 400;
  }

  .bar {
    position: relative;
    height: 12px;
    border-radius: 999px;
    background: var(--border);
    overflow: hidden;
  }

  /* Was mit den aktuellen Editionen überhaupt erreichbar wäre. */
  .ceiling {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--muted);
    opacity: 0.35;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--collection-color, #22a06b);
    transition: width 0.3s ease;
  }

  .legende {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.15rem 0.5rem;
    margin-top: 0.35rem;
  }

  .ampel {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    vertical-align: middle;
    flex: none;
  }
  .ampel.gruen {
    background: #22a06b;
  }
  .ampel.gelb {
    background: #f0c000;
  }
  .ampel.orange {
    background: #e8730e;
  }
  .ampel.rot {
    background: #d61f1f;
  }

  /* Serien-Auswahl – identisch zur Karten-Ansicht. */
  .serien {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin: 0.85rem 0 0.5rem;
  }

  .serie {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    text-align: left;
    padding: 0.9rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .serie:hover {
    border-color: var(--accent);
  }

  .serie.aktiv {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  .serie-name {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .serie-meta {
    font-size: 0.85rem;
  }

  .gruppe {
    margin-top: 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0 1rem;
  }

  .gruppe summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    font-weight: 600;
    padding: 0.75rem 0;
    cursor: pointer;
    list-style: revert;
  }

  .gruppe summary .ed-name {
    font-size: 1rem;
  }

  .chance-chip {
    margin-left: auto;
    font-size: 0.8rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: var(--collection-color, #22a06b);
    color: #fff;
    cursor: help;
  }

  .chance-chip.leer {
    background: var(--muted);
  }

  .empfehlung {
    margin: 0.25rem 0 0.75rem;
    font-size: 0.9rem;
  }

  .chance-zeile {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.3rem 0.6rem;
    margin: 0.6rem 0 1rem;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .chance-zeile .schnitt {
    font-weight: 700;
  }

  .staffel {
    font-size: 0.82rem;
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    white-space: nowrap;
  }

  .scroll {
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.88rem;
  }

  th,
  td {
    border: 1px solid var(--border);
    padding: 0.35rem 0.6rem;
    text-align: center;
    vertical-align: middle;
  }

  th.links {
    text-align: left;
    white-space: nowrap;
  }

  td.stark {
    font-weight: 700;
    color: var(--collection-color, #22a06b);
  }

  .settings {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .feld {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.9rem;
  }

  .feld.reihe {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .aktionen {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .aktionen button,
  .datei-btn {
    font: inherit;
    font-size: 0.9rem;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card);
    color: var(--fg);
    cursor: pointer;
  }

  .aktionen button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .datei-btn input {
    display: none;
  }

  .gefahr {
    border-color: var(--accent);
    color: var(--accent);
  }

  .ok {
    color: #22a06b;
  }
  .fehler {
    color: var(--accent);
  }

  .spezies {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    columns: 2 220px;
  }

  .spezies li {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.15rem 0;
    break-inside: avoid;
  }

  .spezies .num {
    font-variant-numeric: tabular-nums;
    font-size: 0.8rem;
  }

  .spezies .sp-name {
    flex: 1;
  }

  .grid-wrap {
    padding-bottom: 1rem;
  }

  .num {
    font-variant-numeric: tabular-nums;
  }
</style>

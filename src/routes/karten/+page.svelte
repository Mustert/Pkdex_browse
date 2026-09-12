<script lang="ts">
  import CardGrid from '$lib/components/CardGrid.svelte';
  import SearchField from '$lib/components/SearchField.svelte';
  import { filterCards } from '$lib/cards/filter';
  import { createCardFilter } from '$lib/state/card-filter.svelte';
  import { restoreListPosition } from '$lib/state/return-nav';
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const filter = createCardFilter();

  const gefiltert = $derived(
    filterCards(data.karten, {
      query: filter.query,
      editionen: filter.editionen
    })
  );

  // Serien in der Reihenfolge, in der ihre Editionen in editions.json stehen
  // (alt -> neu). Jede Serie wird oben zu einer Auswahl-Card.
  const serienNamen = $derived([...new Set(data.editionen.map((e) => e.serie))]);
  const serien = $derived(
    serienNamen.map((name) => ({
      name,
      anzahl: data.editionen.filter((e) => e.serie === name).length
    }))
  );

  // Gewaehlte Serie liegt in der sessionStorage, damit sie den Browser-Zurueck-
  // Button und den "Zur Uebersicht"-Link ueberlebt.
  const SERIE_KEY = 'pokellector:karten-serie:v1';

  function ladeSerie(): string {
    if (browser) {
      try {
        const s = sessionStorage.getItem(SERIE_KEY);
        if (s) return s;
      } catch {
        /* ignore */
      }
    }
    // Default: neueste Serie (die letzte in der Editionsreihenfolge).
    return data.editionen.at(-1)?.serie ?? '';
  }

  let gewaehlteSerie = $state(ladeSerie());
  // Fallback, falls der gemerkte Wert nicht mehr existiert.
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

  // Bei aktiver Suche zaehlen Treffer aus allen Serien; sonst nur die Editionen
  // der gewaehlten Serie.
  const sucheAktiv = $derived(filter.isActive);

  const nachEdition = $derived(
    data.editionen
      .filter((edition) => sucheAktiv || edition.serie === aktiveSerie)
      .map((edition) => ({
        edition,
        karten: gefiltert.filter((k) => k.editionKuerzel === edition.kuerzel)
      }))
      .filter((gruppe) => gruppe.karten.length > 0)
  );

  // Editionen sind standardmaessig eingeklappt: das Kartenraster (und damit dessen
  // Bilder) wird erst gerendert, wenn eine Edition tatsaechlich aufgeklappt wird -
  // sonst laedt die Seite alle Kartenbilder einer Serie auf einmal.
  //
  // Der Auf/Zu-Zustand liegt in der sessionStorage, damit er sowohl den
  // Browser-Zurueck-Button als auch den "Zur Uebersicht"-Link ueberlebt: man
  // kommt an die gleiche Stelle zurueck, an der man losgelaufen ist.
  const OFFEN_KEY = 'pokellector:karten-offen:v1';

  function ladeOffen(): Set<string> {
    if (!browser) return new Set();
    try {
      return new Set(JSON.parse(sessionStorage.getItem(OFFEN_KEY) ?? '[]') as string[]);
    } catch {
      return new Set();
    }
  }

  let manuellOffen = $state(ladeOffen());

  function toggle(kuerzel: string, offen: boolean) {
    const next = new Set(manuellOffen);
    if (offen) next.add(kuerzel);
    else next.delete(kuerzel);
    manuellOffen = next;
    if (browser) {
      try {
        sessionStorage.setItem(OFFEN_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
    }
  }

  // Bei aktiver Suche/Filterung sollen die (wenigen) Treffer sofort sichtbar sein,
  // unabhaengig vom manuellen Auf/Zu-Zustand.
  const istOffen = (kuerzel: string) => sucheAktiv || manuellOffen.has(kuerzel);

  afterNavigate(({ type }) => {
    if (type !== 'enter' && type !== 'link') return;

    // Ruecksprung von einer Kartenseite via #ed-XXX: die zugehoerige Serie
    // aktivieren, sonst waere diese Edition gar nicht sichtbar.
    if (browser) {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash.startsWith('ed-')) {
        const ed = data.editionen.find((e) => e.kuerzel === hash.slice(3));
        if (ed && ed.serie !== aktiveSerie) waehleSerie(ed.serie);
      }
    }

    restoreListPosition('/karten');
  });
</script>

<h1>Karten</h1>

<div class="controls">
  <SearchField
    value={filter.query}
    oninput={(value) => (filter.query = value)}
    placeholder="Kartenname…"
    label="Karten suchen"
  />
  <span class="muted count">{gefiltert.length} von {data.karten.length}</span>
</div>

<div class="serien" role="tablist" aria-label="Serie wählen">
  {#each serien as serie (serie.name)}
    <button
      type="button"
      role="tab"
      class="serie"
      class:aktiv={!sucheAktiv && serie.name === aktiveSerie}
      aria-selected={!sucheAktiv && serie.name === aktiveSerie}
      onclick={() => waehleSerie(serie.name)}
    >
      <span class="serie-name">{serie.name}</span>
      <span class="serie-meta muted">{serie.anzahl} Editionen</span>
    </button>
  {/each}
</div>

{#if sucheAktiv}
  <p class="muted hinweis">Suchtreffer aus allen Serien.</p>
{/if}

{#if nachEdition.length === 0}
  <p class="muted">Keine Treffer.</p>
{:else}
  {#each nachEdition as gruppe (gruppe.edition.kuerzel)}
    <details
      id="ed-{gruppe.edition.kuerzel}"
      class="gruppe"
      open={istOffen(gruppe.edition.kuerzel)}
      ontoggle={(e) => toggle(gruppe.edition.kuerzel, e.currentTarget.open)}
    >
      <summary>{gruppe.edition.name} <span class="muted">({gruppe.karten.length})</span></summary>
      {#if istOffen(gruppe.edition.kuerzel)}
        <CardGrid karten={gruppe.karten} />
      {/if}
    </details>
  {/each}
{/if}

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: center;
    margin: 1rem 0;
  }

  .count {
    margin-left: auto;
    font-size: 0.9rem;
  }

  .serien {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin: 0 0 1rem;
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

  .hinweis {
    margin: -0.25rem 0 0.75rem;
    font-size: 0.9rem;
  }

  .gruppe {
    margin-top: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0 1rem;
  }

  .gruppe summary {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.85rem 0;
    cursor: pointer;
    list-style: revert;
  }

  .gruppe summary .muted {
    font-weight: 400;
    font-size: 0.9rem;
  }

  .gruppe :global(.grid) {
    padding-bottom: 1rem;
  }
</style>

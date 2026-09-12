<script lang="ts">
  import ChipToggleGroup from '$lib/components/ChipToggleGroup.svelte';
  import RarityMatrixTable from '$lib/components/RarityMatrixTable.svelte';
  import SearchField from '$lib/components/SearchField.svelte';
  import { baueMatrix, matrixSpalten } from '$lib/cards/matrix';
  import { availableGenerations, filterPokedex } from '$lib/pokedex/filter';
  import { createPokedexFilter } from '$lib/state/pokedex-filter.svelte';
  import { restoreListPosition } from '$lib/state/return-nav';
  import { afterNavigate } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Nur beim echten Betreten der Seite (Erstaufruf oder "Zur Übersicht"-Link),
  // nicht bei URL-only-Filterupdates ('goto') und nicht bei Browser-Zurück
  // ('popstate' – da restauriert SvelteKit den Scroll selbst).
  afterNavigate(({ type }) => {
    if (type === 'enter' || type === 'link') restoreListPosition('/');
  });

  const filter = createPokedexFilter();
  const spalten = $derived(matrixSpalten(data.rarities));
  const generationen = $derived(availableGenerations(data.pokedex));

  const gefiltert = $derived(
    filterPokedex(data.pokedex, { query: filter.query, generations: filter.generations })
  );
  const alleZeilen = $derived(baueMatrix(gefiltert, data.cards, spalten));
  const zeilen = $derived(
    filter.onlyWithCards ? alleZeilen.filter((z) => z.gesamt > 0) : alleZeilen
  );
</script>

<h1>Pokédex</h1>

<div class="controls">
  <SearchField
    value={filter.query}
    oninput={(value) => (filter.query = value)}
    placeholder="Name oder Nummer…"
    label="Pokémon suchen"
  />
  <label class="toggle">
    <input
      type="checkbox"
      checked={filter.onlyWithCards}
      onchange={(e) => (filter.onlyWithCards = e.currentTarget.checked)}
    />
    nur mit Karten
  </label>
  <span class="muted count">{zeilen.length} von {data.pokedex.length}</span>
</div>

<div class="filters">
  <ChipToggleGroup
    options={generationen}
    selected={filter.generations}
    label={(g) => `Gen ${g}`}
    allLabel="Alle"
    ariaLabel="Generationen filtern"
    onchange={(selected) => (filter.generations = selected)}
  />
</div>

<RarityMatrixTable {spalten} {zeilen} />

{#if zeilen.length === 0}
  <p class="muted">Keine Treffer.</p>
{/if}

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: center;
    margin: 1rem 0;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.9rem;
  }

  .count {
    margin-left: auto;
    font-size: 0.9rem;
  }

  .filters {
    margin: 0 0 1.5rem;
  }
</style>

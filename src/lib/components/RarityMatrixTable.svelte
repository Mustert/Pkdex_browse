<script lang="ts">
  import { base } from '$app/paths';
  import type { MatrixSpalte, MatrixZeile } from '$lib/cards/matrix';
  import type { Card } from '$lib/data/types';
  import { dexNumber } from '$lib/pokedex/format';
  import { collection } from '$lib/state/collection.svelte';
  import { playSwoosh } from '$lib/sound';
  import RaritySymbol from './RaritySymbol.svelte';

  interface Props {
    spalten: MatrixSpalte[];
    zeilen: MatrixZeile[];
  }

  let { spalten, zeilen }: Props = $props();

  function badgeKlick(event: MouseEvent, karte: Card) {
    if (!collection.collectorMode) return; // normaler Link -> Kartendetail
    event.preventDefault();
    const entfernen = event.altKey || event.metaKey || event.ctrlKey;
    if (collection.apply(karte.id, entfernen) === 'added') playSwoosh();
  }

  function badgeKontext(event: MouseEvent, karte: Card) {
    if (!collection.collectorMode) return;
    event.preventDefault();
    collection.apply(karte.id, true);
  }
</script>

<div class="scroll">
  <table>
    <thead>
      <tr>
        <th class="pkmn" scope="col">Pokémon</th>
        {#each spalten as spalte (spalte.label)}
          <th scope="col" title={spalte.tooltip}>
            <RaritySymbol rang={spalte.rang} tooltip={spalte.tooltip} />
            <span class="lbl">{spalte.label}</span>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each zeilen as zeile (zeile.pokemon.id)}
        <tr id="dex-{zeile.pokemon.id}">
          <th scope="row" class="pkmn">
            <a href="{base}/pokemon/{zeile.pokemon.id}">
              {#if zeile.pokemon.sprite}
                <img src={zeile.pokemon.sprite} alt="" width="40" height="40" loading="lazy" />
              {:else}
                <span class="sprite-fallback" aria-hidden="true">?</span>
              {/if}
              <span class="label">
                <span class="muted num">{dexNumber(zeile.pokemon.id)}</span>
                <span>{zeile.pokemon.name.de}</span>
              </span>
            </a>
          </th>
          {#each zeile.zellen as zelle (zelle.spalte.label)}
            <td>
              {#each zelle.karten as karte (karte.id)}
                {@const besessen = collection.has(karte.id)}
                <a
                  class="badge"
                  class:owned={collection.collectorMode && besessen}
                  href="{base}/karte/{karte.id}"
                  data-card
                  data-owned={besessen}
                  title={collection.collectorMode
                    ? besessen
                      ? `${karte.name} – in deiner Sammlung (Klick entfernt)`
                      : `${karte.name} – Klick sammelt`
                    : `${karte.name} · ${karte.seltenheitDe} · ${karte.editionKuerzel} ${karte.nummer}`}
                  onclick={(e) => badgeKlick(e, karte)}
                  oncontextmenu={(e) => badgeKontext(e, karte)}
                >
                  {karte.editionKuerzel}&nbsp;{karte.nummer}
                </a>
              {/each}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scroll {
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.9rem;
  }

  th,
  td {
    border: 1px solid var(--border);
    padding: 0.35rem 0.5rem;
    text-align: center;
    vertical-align: middle;
  }

  thead th {
    position: sticky;
    top: 0;
    background: var(--card);
    white-space: nowrap;
  }

  thead th .lbl {
    display: block;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--muted);
  }

  .pkmn {
    text-align: left;
    white-space: nowrap;
  }

  th.pkmn {
    position: sticky;
    left: 0;
    background: var(--card);
    z-index: 1;
  }

  thead th.pkmn {
    z-index: 2;
  }

  .pkmn a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pkmn img,
  .sprite-fallback {
    width: 40px;
    height: 40px;
    flex: none;
  }

  .sprite-fallback {
    display: grid;
    place-items: center;
    color: var(--muted);
  }

  .label {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .num {
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }

  td {
    min-width: 3.5rem;
  }

  .badge {
    display: inline-block;
    margin: 0.12rem;
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .badge:hover {
    border-color: var(--accent);
    text-decoration: none;
  }

  .badge.owned {
    background: var(--collection-color, #22a06b);
    border-color: var(--collection-color, #22a06b);
    color: #fff;
  }
</style>

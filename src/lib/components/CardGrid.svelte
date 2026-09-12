<script lang="ts">
  import { base } from '$app/paths';
  import type { Card } from '$lib/data/types';
  import { collection } from '$lib/state/collection.svelte';
  import { playSwoosh } from '$lib/sound';
  import { thumbnail, andereAufloesung } from '$lib/cards/bild';

  interface Props {
    karten: Card[];
  }

  let { karten }: Props = $props();

  // Karten, deren Bild in beiden Auflösungen scheitert -> Platzhalter.
  let ohneBild = $state<string[]>([]);

  function bildFehler(event: Event, id: string) {
    const img = event.currentTarget as HTMLImageElement;
    const alt = andereAufloesung(img.src);
    if (!img.dataset.zweitversuch && alt !== img.src) {
      img.dataset.zweitversuch = '1';
      img.src = alt;
    } else if (!ohneBild.includes(id)) {
      ohneBild = [...ohneBild, id];
    }
  }

  function sammelKlick(event: MouseEvent, karte: Card) {
    if (!collection.collectorMode) return; // normaler Link -> Kartendetail
    event.preventDefault();
    const entfernen = event.altKey || event.metaKey || event.ctrlKey;
    if (collection.apply(karte.id, entfernen) === 'added') playSwoosh();
  }

  function kontextMenu(event: MouseEvent, karte: Card) {
    if (!collection.collectorMode) return;
    event.preventDefault();
    collection.apply(karte.id, true);
  }
</script>

<ul class="grid">
  {#each karten as karte (karte.id)}
    {@const besessen = collection.has(karte.id)}
    <li>
      <a
        href="{base}/karte/{karte.id}"
        data-card
        data-owned={besessen}
        class:owned={collection.collectorMode && besessen}
        title={collection.collectorMode
          ? besessen
            ? `${karte.name} – in deiner Sammlung (Klick entfernt)`
            : `${karte.name} – Klick sammelt`
          : `${karte.name} · ${karte.seltenheitDe ?? 'unbekannte Seltenheit'}`}
        onclick={(e) => sammelKlick(e, karte)}
        oncontextmenu={(e) => kontextMenu(e, karte)}
      >
        {#if karte.bild && !ohneBild.includes(karte.id)}
          <img
            src={thumbnail(karte.bild)}
            alt={karte.name}
            loading="lazy"
            onerror={(e) => bildFehler(e, karte.id)}
          />
        {:else}
          <div class="bild-fallback" aria-hidden="true">?</div>
        {/if}
        <span class="label">{karte.editionKuerzel}&nbsp;{karte.nummer}</span>
      </a>
    </li>
  {/each}
</ul>

<style>
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 0.75rem;
  }

  .grid a {
    display: block;
    text-align: center;
  }

  .grid img,
  .bild-fallback {
    width: 100%;
    aspect-ratio: 5 / 7;
    object-fit: cover;
    border-radius: 6px;
    display: block;
    border: 3px solid transparent;
  }

  .grid a.owned img,
  .grid a.owned .bild-fallback {
    border-color: var(--collection-color, #22a06b);
    box-shadow: 0 0 0 1px var(--collection-color, #22a06b);
  }

  .bild-fallback {
    display: grid;
    place-items: center;
    background: var(--card);
    color: var(--muted);
  }

  .label {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.78rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>

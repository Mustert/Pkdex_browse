<script lang="ts">
  import { base } from '$app/paths';
  import RaritySymbol from '$lib/components/RaritySymbol.svelte';
  import { dexNumber } from '$lib/pokedex/format';
  import { andereAufloesung } from '$lib/cards/bild';
  import { overviewHref } from '$lib/state/return-nav';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Manche TCGdex-Karten (v. a. Trainer-/Galar-Galerie) haben im deutschen
  // Asset-Satz nur eine Auflösung. Im Fehlerfall die andere probieren, dann Platzhalter.
  let bildWeg = $state(false);
  $effect(() => {
    data.karte.id; // bei Kartenwechsel zurücksetzen
    bildWeg = false;
  });

  function bildFehler(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    const alt = andereAufloesung(img.src);
    if (!img.dataset.zweitversuch && alt !== img.src) {
      img.dataset.zweitversuch = '1';
      img.src = alt;
    } else {
      bildWeg = true;
    }
  }

  const erscheinungsdatum = $derived(
    data.edition ? new Date(data.edition.erscheinungsdatum).toLocaleDateString('de-DE') : null
  );

  // Zurück an die Herkunft; sonst zur Zeile des abgebildeten Pokémon bzw. zur Edition.
  const zurUebersicht = $derived(
    overviewHref(
      data.pokemon.length > 0
        ? `${base}/#dex-${data.pokemon[0].id}`
        : `${base}/karten#ed-${data.karte.editionKuerzel}`
    )
  );
</script>

<p><a href={zurUebersicht} data-sveltekit-noscroll>← Zur Übersicht</a></p>

<article class="karte">
  <div class="bild">
    {#if data.karte.bild && !bildWeg}
      <img src={data.karte.bild} alt={data.karte.name} loading="lazy" onerror={bildFehler} />
    {:else}
      <div class="bild-fallback" aria-hidden="true">?</div>
    {/if}
  </div>

  <div class="info">
    <h1>{data.karte.name}</h1>
    <p class="edition">
      {#if data.edition}
        {data.edition.name} · {erscheinungsdatum}
      {:else}
        {data.karte.editionKuerzel}
      {/if}
      · Nr. {data.karte.nummer}{#if data.edition}/{data.edition.anzahlKarten}{/if}
    </p>

    {#if data.karte.seltenheitDe}
      <p class="rarity">
        <RaritySymbol rang={data.rarity?.rang ?? null} tooltip={data.karte.seltenheitDe} size={20} />
        {data.karte.seltenheitDe}
      </p>
    {/if}

    {#if data.pokemon.length > 0}
      <div class="pokemon-liste">
        <h2>Abgebildetes Pokémon</h2>
        {#each data.pokemon as pokemon (pokemon.id)}
          <a class="pokemon" href="{base}/pokemon/{pokemon.id}">
            {#if pokemon.sprite}
              <img src={pokemon.sprite} alt="" width="40" height="40" />
            {/if}
            <span class="muted num">{dexNumber(pokemon.id)}</span>
            <span>{pokemon.name.de}</span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</article>

<style>
  .karte {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .bild {
    flex: none;
    width: min(320px, 100%);
  }

  .bild img {
    width: 100%;
    height: auto;
    border-radius: var(--radius);
    display: block;
  }

  .bild-fallback {
    width: 100%;
    aspect-ratio: 5 / 7;
    display: grid;
    place-items: center;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--muted);
    font-size: 2rem;
  }

  .info {
    flex: 1 1 260px;
    min-width: 0;
  }

  h1 {
    margin: 0 0 0.35rem;
  }

  .edition {
    color: var(--muted);
    margin: 0 0 0.75rem;
  }

  .rarity {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .pokemon-liste {
    margin-top: 1.5rem;
  }

  .pokemon-liste h2 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
  }

  .pokemon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0;
  }

  .num {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
  }
</style>

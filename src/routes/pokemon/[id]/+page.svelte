<script lang="ts">
  import { base } from '$app/paths';
  import { dexNumber } from '$lib/pokedex/format';
  import { overviewHref } from '$lib/state/return-nav';
  import type { PageData } from './$types';
  import PokemonHeader from './PokemonHeader.svelte';
  import TcgCardList from './TcgCardList.svelte';

  let { data }: { data: PageData } = $props();

  const flavor = $derived(data.entry.flavorText.de || data.entry.flavorText.en);

  // Zurück an die Stelle, von der man kam; sonst zur Zeile dieses Pokémon im Pokédex.
  const zurUebersicht = $derived(overviewHref(`${base}/#dex-${data.entry.id}`));
</script>

<nav class="pager">
  {#if data.vorher}
    <a href="{base}/pokemon/{data.vorher.id}">← {dexNumber(data.vorher.id)} {data.vorher.name.de}</a>
  {:else}
    <span></span>
  {/if}
  <a href={zurUebersicht} data-sveltekit-noscroll>Übersicht</a>
  {#if data.nachher}
    <a href="{base}/pokemon/{data.nachher.id}">
      {data.nachher.name.de} {dexNumber(data.nachher.id)} →
    </a>
  {:else}
    <span></span>
  {/if}
</nav>

<article>
  <PokemonHeader pokemon={data.entry} evolvesFrom={data.vorentwicklung} />

  {#if flavor}
    <p class="flavor">{flavor}</p>
  {/if}

  <TcgCardList karten={data.karten} />
</article>

<style>
  .pager {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .flavor {
    margin: 1.5rem 0;
    padding: 1rem 1.2rem;
    border-left: 3px solid var(--accent);
    background: var(--card);
    border-radius: 0 var(--radius) var(--radius) 0;
  }
</style>

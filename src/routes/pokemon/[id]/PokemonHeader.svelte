<script lang="ts">
  import { base } from '$app/paths';
  import TypeBadge from '$lib/components/TypeBadge.svelte';
  import type { PokedexEntry } from '$lib/data/types';
  import { dexNumber, typeList } from '$lib/pokedex/format';

  interface Props {
    pokemon: PokedexEntry;
    evolvesFrom: PokedexEntry | null;
  }

  let { pokemon, evolvesFrom }: Props = $props();
</script>

<header class="head">
  {#if pokemon.artwork}
    <img class="art" src={pokemon.artwork} alt={pokemon.name.de} width="320" height="320" />
  {/if}
  <div>
    <p class="muted num">{dexNumber(pokemon.id)} · Generation {pokemon.generation}</p>
    <h1>{pokemon.name.de}</h1>
    <p class="muted en">{pokemon.name.en}</p>
    <p class="types">
      {#each typeList(pokemon) as t (t.slug)}
        <TypeBadge type={t.slug} label={t.name} />
      {/each}
    </p>
    <p class="genus">{pokemon.genus.de || pokemon.genus.en}</p>
    {#if evolvesFrom}
      <p class="muted">
        Entwickelt sich aus
        <a href="{base}/pokemon/{evolvesFrom.id}">{evolvesFrom.name.de}</a>
      </p>
    {/if}
    {#if pokemon.formen.length}
      <p class="muted">Weitere Formen: {pokemon.formen.join(', ')}</p>
    {/if}
  </div>
</header>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .art {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    width: 320px;
    height: auto;
    aspect-ratio: 1;
    object-fit: contain;
  }

  h1 {
    margin: 0.1rem 0;
  }

  .num {
    font-variant-numeric: tabular-nums;
    margin: 0;
  }

  .en {
    margin: 0 0 0.6rem;
  }

  .types {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0.4rem 0;
  }

  .genus {
    font-weight: 600;
  }
</style>

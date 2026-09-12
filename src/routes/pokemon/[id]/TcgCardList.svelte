<script lang="ts">
  import CardGrid from '$lib/components/CardGrid.svelte';
  import type { Card } from '$lib/data/types';

  interface Props {
    karten: Card[];
  }

  let { karten }: Props = $props();
</script>

<section class="tcg">
  <h2>TCG-Karten {#if karten.length > 0}<span class="muted">({karten.length})</span>{/if}</h2>

  {#if karten.length === 0}
    <p class="muted">Keine Sammelkarten dieses Pokémon bekannt.</p>
  {:else}
    <CardGrid {karten} />
  {/if}
</section>

<style>
  .tcg {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem;
  }
</style>

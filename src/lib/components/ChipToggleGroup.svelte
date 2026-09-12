<script lang="ts" generics="T">
  /**
   * Generische Mehrfachauswahl als Chip-Leiste.
   * `generics="T"` ist ein echtes Svelte-5-Feature: der Elementtyp ist frei,
   * solange `label` (und bei Objekten `key`) passend übergeben werden.
   */
  interface Props {
    options: T[];
    selected: T[];
    label: (option: T) => string;
    /** Stabiler Schlüssel je Option; Default reicht für primitive Werte. */
    key?: (option: T) => string | number;
    onchange: (selected: T[]) => void;
    ariaLabel: string;
    /** Wenn gesetzt: zusätzlicher "Alle"-Chip, der die Auswahl leert. */
    allLabel?: string;
  }

  let {
    options,
    selected,
    label,
    key = (o) => o as unknown as string | number,
    onchange,
    ariaLabel,
    allLabel
  }: Props = $props();

  const selectedKeys = $derived(new Set(selected.map(key)));
  const isSelected = (o: T) => selectedKeys.has(key(o));

  function toggle(option: T) {
    onchange(
      isSelected(option)
        ? selected.filter((s) => key(s) !== key(option))
        : [...selected, option]
    );
  }
</script>

<div class="chips" role="group" aria-label={ariaLabel}>
  {#if allLabel}
    <button
      type="button"
      class="chip"
      class:active={selected.length === 0}
      aria-pressed={selected.length === 0}
      onclick={() => onchange([])}
    >
      {allLabel}
    </button>
  {/if}
  {#each options as option (key(option))}
    <button
      type="button"
      class="chip"
      class:active={isSelected(option)}
      aria-pressed={isSelected(option)}
      onclick={() => toggle(option)}
    >
      {label(option)}
    </button>
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    padding: 0.35rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--card);
    color: var(--fg);
    cursor: pointer;
  }

  .chip:hover {
    border-color: var(--accent);
  }

  .chip.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 600;
  }
</style>

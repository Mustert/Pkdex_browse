<script lang="ts">
  /**
   * Kleines, selbstgebautes SVG-Symbol je Seltenheits-Rang.
   * `<title>` liefert den nativen Mouseover-Tooltip (zusätzlich als aria-label).
   * Farbe folgt `currentColor`, passt sich also Light/Dark an.
   */
  interface Props {
    /** Rang der Spalte; null = Sammelspalte "Sonstige". */
    rang: number | null;
    /** Tooltip-Text. */
    tooltip: string;
    size?: number;
  }

  let { rang, tooltip, size = 16 }: Props = $props();

  const STAR =
    'M12 2 L14.85 8.6 L22 9.24 L16.5 13.97 L18.18 21 L12 17.27 L5.82 21 L7.5 13.97 L2 9.24 L9.15 8.6 Z';

  type Kind = 'circle' | 'diamond' | 'star1' | 'star2' | 'star1o' | 'star2o' | 'other';

  const KIND_BY_RANG: Record<number, Kind> = {
    1: 'circle',
    2: 'diamond',
    3: 'star1',
    4: 'star2',
    6: 'star1o',
    8: 'star2o'
  };

  const kind = $derived<Kind>(rang === null ? 'other' : (KIND_BY_RANG[rang] ?? 'other'));
</script>

<svg
  class="sym"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  role="img"
  aria-label={tooltip}
>
  <title>{tooltip}</title>

  {#if kind === 'circle'}
    <circle cx="12" cy="12" r="8" fill="currentColor" />
  {:else if kind === 'diamond'}
    <path d="M12 3 L21 12 L12 21 L3 12 Z" fill="currentColor" />
  {:else if kind === 'star1'}
    <path d={STAR} fill="currentColor" />
  {:else if kind === 'star1o'}
    <path d={STAR} fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  {:else if kind === 'star2' || kind === 'star2o'}
    <g transform="translate(0.5 6) scale(0.5)">
      <path
        d={STAR}
        fill={kind === 'star2' ? 'currentColor' : 'none'}
        stroke="currentColor"
        stroke-width={kind === 'star2o' ? 3 : 0}
        stroke-linejoin="round"
      />
    </g>
    <g transform="translate(12.5 6) scale(0.5)">
      <path
        d={STAR}
        fill={kind === 'star2' ? 'currentColor' : 'none'}
        stroke="currentColor"
        stroke-width={kind === 'star2o' ? 3 : 0}
        stroke-linejoin="round"
      />
    </g>
  {:else}
    <circle cx="5" cy="12" r="2.4" fill="currentColor" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    <circle cx="19" cy="12" r="2.4" fill="currentColor" />
  {/if}
</svg>

<style>
  .sym {
    display: inline-block;
    vertical-align: -0.15em;
  }
</style>

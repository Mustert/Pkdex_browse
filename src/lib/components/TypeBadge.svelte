<script lang="ts">
  interface Props {
    /** Typ-Slug, z. B. "fire" – bestimmt die Farbe. */
    type: string;
    /** Anzeigetext; fällt auf den Slug zurück. */
    label?: string;
  }

  let { type, label }: Props = $props();

  const colors: Record<string, string> = {
    normal: '#9fa19f',
    fire: '#e62829',
    water: '#2980ef',
    electric: '#fac000',
    grass: '#3fa129',
    ice: '#3dcef3',
    fighting: '#ff8000',
    poison: '#9141cb',
    ground: '#915121',
    flying: '#81b9ef',
    psychic: '#ef4179',
    bug: '#91a119',
    rock: '#afa981',
    ghost: '#704170',
    dragon: '#5060e1',
    dark: '#50413f',
    steel: '#60a1b8',
    fairy: '#ef70ef'
  };
</script>

<span class="badge" style="background:{colors[type] ?? '#777'}">{label ?? type}</span>

<style>
  .badge {
    display: inline-block;
    padding: 0.15em 0.65em;
    border-radius: 999px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
  }
</style>

<script lang="ts">
  interface Props {
    /** Kontrollierter Wert. */
    value: string;
    /** Callback bei jeder Eingabe ("props down, events up"). */
    oninput: (value: string) => void;
    placeholder?: string;
    /** Barrierefreies Label (kein sichtbares <label> im Layout). */
    label: string;
  }

  let { value, oninput, placeholder, label }: Props = $props();
</script>

<input
  type="search"
  {placeholder}
  {value}
  aria-label={label}
  oninput={(e) => oninput(e.currentTarget.value)}
/>

<style>
  input {
    flex: 1 1 220px;
    padding: 0.5rem 0.7rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card);
    color: var(--fg);
  }
</style>

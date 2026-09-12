<script lang="ts">
  import '$lib/styles.css';
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';
  import { collection } from '$lib/state/collection.svelte';
  import { rememberOrigin } from '$lib/state/return-nav';

  let { children } = $props();

  let menuOffen = $state(false);

  const pfad = $derived(stripBase(page.url.pathname));

  function stripBase(p: string): string {
    if (base && p.startsWith(base)) return p.slice(base.length) || '/';
    return p;
  }

  const links = [
    { href: `${base}/`, label: 'Pokédex', match: (p: string) => p === '/' },
    { href: `${base}/karten`, label: 'Karten', match: (p: string) => p.startsWith('/karten') },
    {
      href: `${base}/sammlung`,
      label: 'Meine Sammlung',
      match: (p: string) => p.startsWith('/sammlung')
    }
  ];

  // Beim Sprung in eine Detailseite die Herkunft (Listen-Seite + Scrollposition) merken,
  // damit "Zur Übersicht" dorthin zurückführt.
  beforeNavigate(({ from, to }) => {
    if (!from || !to) return;
    const ziel = stripBase(to.url.pathname);
    if (ziel.startsWith('/pokemon/') || ziel.startsWith('/karte/')) {
      rememberOrigin(from.url);
    }
    menuOffen = false;
  });
</script>

<div
  class="app"
  data-collector={collection.collectorMode ? 'on' : 'off'}
  style="--collection-color: {collection.settings.color}; --cursor-plain: url('{base}/cursors/card-sleeve-plain.svg'); --cursor-back: url('{base}/cursors/card-sleeve-back.svg');"
>
  <a class="skip" href="#inhalt">Zum Inhalt springen</a>

  <header class="topbar">
    <button
      type="button"
      class="burger"
      aria-expanded={menuOffen}
      aria-controls="sidenav"
      aria-label="Menü"
      onclick={() => (menuOffen = !menuOffen)}
    >
      <span></span><span></span><span></span>
    </button>

    <a class="brand" href="{base}/">
      <img src="{base}/favicon.svg" alt="" width="24" height="24" />
      <span>Pokéllector</span>
    </a>

    <!-- Rechts oben, wo sonst der Light/Dark-Schalter sitzt. -->
    <label
      class="mode-switch"
      class:an={collection.collectorMode}
      title="Klick sammelt Karten statt zu navigieren. Alt-Klick oder Rechtsklick entfernt sie wieder."
    >
      <input
        type="checkbox"
        checked={collection.collectorMode}
        onchange={(e) => (collection.collectorMode = e.currentTarget.checked)}
        aria-label="Sammlermodus"
      />
      <span class="track" aria-hidden="true"><span class="thumb"></span></span>
      <span class="mode-label">Sammlermodus</span>
    </label>
  </header>

  {#if collection.collectorMode}
    <div class="mode-banner" role="status">
      <strong>Sammlermodus aktiv.</strong> Klick legt eine Karte in die Sammlung, Alt-Klick oder
      Rechtsklick nimmt sie wieder heraus.
    </div>
  {/if}

  <div class="shell">
    <nav id="sidenav" class="sidenav" class:offen={menuOffen} aria-label="Hauptnavigation">
      <ul class="navlinks">
        {#each links as link (link.href)}
          <li>
            <a
              href={link.href}
              aria-current={link.match(pfad) ? 'page' : undefined}
              class:aktiv={link.match(pfad)}
            >
              {link.label}
              {#if link.label === 'Meine Sammlung' && collection.size > 0}
                <span class="count">{collection.size}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <main id="inhalt" class="container">
      {@render children()}
    </main>
  </div>
</div>

<style>
  .app {
    min-height: 100vh;
    --topbar-h: 53px;
  }

  .skip {
    position: absolute;
    left: -999px;
  }
  .skip:focus {
    left: 0.5rem;
    top: 0.5rem;
    z-index: 30;
    background: var(--card);
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  /* --- Globale Kopfzeile --- */
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: var(--topbar-h);
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.1rem;
  }
  .brand:hover {
    text-decoration: none;
  }

  .burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 38px;
    height: 34px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    cursor: pointer;
  }
  .burger span {
    display: block;
    height: 2px;
    background: var(--fg);
    border-radius: 2px;
  }

  /* --- Sammlermodus-Schalter (rechts oben) --- */
  .mode-switch {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    user-select: none;
  }

  .mode-switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    position: relative;
    flex: none;
    width: 40px;
    height: 22px;
    border-radius: 999px;
    background: var(--border);
    transition: background 0.15s ease;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--card);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    transition: transform 0.15s ease;
  }

  .mode-switch.an .track {
    background: var(--accent);
  }
  .mode-switch.an .thumb {
    transform: translateX(18px);
  }

  .mode-switch input:focus-visible ~ .track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .mode-label {
    white-space: nowrap;
  }

  /* --- Hinweisband, wenn aktiv --- */
  .mode-banner {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    background: var(--card);
    background: color-mix(in srgb, var(--accent) 12%, var(--card));
    border-bottom: 1px solid var(--border);
  }

  /* --- Layout: Sidenav links, Inhalt rechts --- */
  .shell {
    display: flex;
    align-items: flex-start;
  }

  .sidenav {
    flex: none;
    width: 210px;
    position: sticky;
    top: var(--topbar-h);
    height: calc(100vh - var(--topbar-h));
    overflow-y: auto;
    border-right: 1px solid var(--border);
    background: var(--card);
    padding: 1.1rem 1rem;
  }

  .navlinks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .navlinks a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 8px;
    font-size: 0.95rem;
  }

  .navlinks a:hover {
    background: var(--bg);
    text-decoration: none;
  }

  .navlinks a.aktiv {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  .count {
    margin-left: auto;
    background: var(--bg);
    color: var(--fg);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
  }

  .navlinks a.aktiv .count {
    background: rgba(255, 255, 255, 0.85);
  }

  .container {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 4rem;
  }

  /* --- Schmale Screens: Sidenav wird per Burger aufgeklappt --- */
  @media (max-width: 720px) {
    .burger {
      display: flex;
    }
    .shell {
      display: block;
    }
    .sidenav {
      position: static;
      width: auto;
      height: auto;
      overflow-y: visible;
      border-right: none;
      border-bottom: 1px solid var(--border);
      display: none;
    }
    .sidenav.offen {
      display: block;
    }
    .container {
      padding: 1.25rem 1rem 3rem;
    }
  }

  @media (max-width: 480px) {
    .mode-label {
      display: none;
    }
  }

  /* --- Cursor im Sammlermodus --- */
  .app[data-collector='on'] :global(a[data-card]),
  .app[data-collector='on'] :global(button[data-card]) {
    cursor: var(--cursor-plain) 8 10, copy;
  }
  .app[data-collector='on'] :global([data-card][data-owned='true']) {
    cursor: var(--cursor-back) 8 10, not-allowed;
  }
</style>

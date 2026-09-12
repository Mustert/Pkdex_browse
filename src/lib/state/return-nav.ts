import { browser } from '$app/environment';
import { base } from '$app/paths';

/**
 * Merkt sich, von welcher Listen-Seite (Pokédex `/` oder Karten `/karten`) der
 * Nutzer in eine Detailseite gesprungen ist – inkl. Scrollposition.
 *
 * Zweck: der "Zur Übersicht"-Link auf den Detailseiten führt zurück an genau
 * die Stelle, an der man losgelaufen ist, statt an den Seitenanfang.
 * Der Browser-Zurück-Button nutzt weiterhin die native Scroll-Restoration
 * von SvelteKit; dies hier ist nur für den expliziten Link.
 */

const KEY = 'pokellector:origin:v1';

interface Origin {
  /** Bereits `base`-präfigierter Pfad inkl. Query, direkt als href nutzbar. */
  href: string;
  /** Reiner Pfad ohne `base`, für den Abgleich beim Wiederbetreten. */
  path: string;
  scrollY: number;
}

const LIST_PATHS = ['/', '/karten'];

function stripBase(pathname: string): string {
  if (base && pathname.startsWith(base)) return pathname.slice(base.length) || '/';
  return pathname;
}

/** Beim Verlassen einer Listen-Seite Richtung Detailseite aufrufen. */
export function rememberOrigin(from: URL): void {
  if (!browser) return;
  const path = stripBase(from.pathname);
  if (!LIST_PATHS.includes(path)) return;
  const origin: Origin = {
    href: from.pathname + from.search,
    path,
    scrollY: window.scrollY
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(origin));
  } catch {
    /* sessionStorage kann fehlen – dann eben ohne Rücksprung */
  }
}

function read(): Origin | null {
  if (!browser) return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Origin) : null;
  } catch {
    return null;
  }
}

/**
 * href für den "Zur Übersicht"-Link. Passt der gemerkte Ursprung zu einer der
 * erlaubten Listen-Seiten, führt er dorthin zurück; sonst `fallback`.
 */
export function overviewHref(fallback = `${base}/`): string {
  return read()?.href ?? fallback;
}

/**
 * Beim Betreten einer Listen-Seite: wenn der gemerkte Ursprung diese Seite ist,
 * die Scrollposition zurückgeben (und den Merker verbrauchen). Sonst null.
 */
export function consumeOriginScroll(currentPath: string): number | null {
  const origin = read();
  if (!origin || origin.path !== currentPath) return null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return origin.scrollY;
}

/**
 * Aus `afterNavigate` einer Listen-Seite aufrufen. Stellt die Position wieder her:
 * 1. `#anker` in der URL -> Element in den Sichtbereich scrollen (z. B. `#dex-6`)
 * 2. sonst gemerkte Scrollposition des "Zur Übersicht"-Rücksprungs
 *
 * Der native Browser-Zurück-Button wird hiervon nicht berührt (SvelteKit
 * restauriert dort selbst).
 */
export function restoreListPosition(currentPath: string): void {
  if (!browser) return;

  // Mehrfach nachfassen: die grosse Pokédex-Tabelle (1025 Zeilen) bzw. das
  // Kartenraster brauchen ein paar Frames, bis das Layout final steht. Instant
  // scrollen, nicht "smooth" – sonst animiert der Browser auf eine veraltete
  // Zielposition. setTimeout feuert auch im Hintergrund-Tab (rAF nicht).
  const versuche = [0, 50, 150, 300, 500];

  const hash = window.location.hash;
  if (hash.length > 1) {
    const id = decodeURIComponent(hash.slice(1));
    const lauf = () => {
      const ziel = document.getElementById(id);
      if (ziel) ziel.scrollIntoView({ behavior: 'auto', block: 'center' });
    };
    for (const ms of versuche) setTimeout(lauf, ms);
    return;
  }

  const y = consumeOriginScroll(currentPath);
  if (y === null) return;
  for (const ms of versuche) setTimeout(() => window.scrollTo({ top: y, behavior: 'auto' }), ms);
}

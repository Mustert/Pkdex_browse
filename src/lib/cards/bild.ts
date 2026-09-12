/**
 * Helfer rund um die TCGdex-Bild-URLs.
 *
 * TCGdex legt je Karte zwei Auflösungen ab (`.../low.png`, `.../high.png`).
 * Bei einigen Karten – vor allem in den Trainer-/Galar-Galerie-Untersets der
 * Schwert-&-Schild-Serie – existiert im deutschen Asset-Satz nur *eine* der
 * beiden. Deshalb wird im Fehlerfall auf die jeweils andere umgeschaltet, bevor
 * der Platzhalter greift (siehe `CardGrid.svelte` / `karte/[id]/+page.svelte`).
 */

/** `.../high.png` fürs Raster zu `.../low.png` verkleinern (spart Bandbreite). */
export function thumbnail(bild: string): string {
  return bild.replace(/\/high\.png$/, '/low.png');
}

/** Zwischen `low.png` und `high.png` derselben Karte wechseln. */
export function andereAufloesung(url: string): string {
  return url.endsWith('/low.png')
    ? url.replace(/\/low\.png$/, '/high.png')
    : url.replace(/\/high\.png$/, '/low.png');
}

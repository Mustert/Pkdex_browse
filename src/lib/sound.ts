import { browser } from '$app/environment';
import { base } from '$app/paths';
import { collection } from '$lib/state/collection.svelte';

/**
 * Kurzer "Swoosh" beim Aufnehmen einer Karte in die Sammlung.
 * Ein einziges vorgeladenes Audio-Element, das bei jedem Aufruf zurückgespult
 * und neu abgespielt wird. Autoplay-Policy ist unkritisch, weil der Sound
 * immer aus einem Klick heraus kommt (Nutzer-Geste).
 */

let el: HTMLAudioElement | null = null;

function element(): HTMLAudioElement | null {
  if (!browser) return null;
  if (!el) {
    el = new Audio(`${base}/sound/swoosh.wav`);
    el.preload = 'auto';
    el.volume = 0.5;
  }
  return el;
}

export function playSwoosh(): void {
  if (!collection.settings.sound) return;
  const audio = element();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    /* egal – Sound ist Beiwerk */
  }
}

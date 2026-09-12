import { base } from '$app/paths';
import type { Card, CardsFile } from './types';

let cache: Promise<Card[]> | null = null;

export function loadCards(): Promise<Card[]> {
  cache ??= fetch(`${base}/data/cards.json`)
    .then((res) => {
      if (res.status === 404) return { karten: [] } satisfies CardsFile;
      if (!res.ok) throw new Error(`cards.json: HTTP ${res.status}`);
      return res.json() as Promise<CardsFile>;
    })
    .then((file) => file.karten);
  return cache;
}

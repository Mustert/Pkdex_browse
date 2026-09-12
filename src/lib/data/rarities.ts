import { base } from '$app/paths';
import type { Rarity, RaritiesFile } from './types';

let cache: Promise<Rarity[]> | null = null;

export function loadRarities(): Promise<Rarity[]> {
  cache ??= fetch(`${base}/data/rarities.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`rarities.json: HTTP ${res.status}`);
      return res.json() as Promise<RaritiesFile>;
    })
    .then((file) => [...file.seltenheiten].sort((a, b) => a.rang - b.rang));
  return cache;
}

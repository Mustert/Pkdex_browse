import { base } from '$app/paths';
import type { Edition, EditionsFile } from './types';

let cache: Promise<Edition[]> | null = null;

export function loadEditions(): Promise<Edition[]> {
  cache ??= fetch(`${base}/data/editions.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`editions.json: HTTP ${res.status}`);
      return res.json() as Promise<EditionsFile>;
    })
    .then((file) => file.editionen);
  return cache;
}

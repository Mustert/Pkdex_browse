import { goto } from '$app/navigation';
import { page } from '$app/state';

/**
 * Filter-Zustand der Pokedex-Liste – gehalten in der URL (?q=…&gen=1,4).
 *
 * Vorteile gegenüber lokalem $state:
 *  - teilbar per Link, überlebt Reload, Zurück-Button funktioniert
 *  - eine einzige Quelle der Wahrheit
 *
 * `page` kommt aus `$app/state` (Svelte-5-Idiom, nicht das alte `$app/stores`);
 * die Getter lesen `page.url`, wodurch abhängige `$derived`/Templates bei
 * Navigation automatisch neu berechnen.
 */
export interface PokedexFilter {
  query: string;
  generations: number[];
  /** Nur Pokemon mit mindestens einer Karte zeigen (Default: false – alle werden gelistet). */
  onlyWithCards: boolean;
  readonly isActive: boolean;
  toggleGeneration(generation: number): void;
  reset(): void;
}

export function createPokedexFilter(): PokedexFilter {
  function param(key: string): string | null {
    return page.url.searchParams.get(key);
  }

  function patch(values: Record<string, string | null>): void {
    const next = new URLSearchParams(page.url.searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const url = new URL(page.url);
    url.search = next.toString();
    void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
  }

  return {
    get query() {
      return param('q') ?? '';
    },
    set query(value: string) {
      patch({ q: value || null });
    },

    get generations() {
      const raw = param('gen');
      if (!raw) return [];
      return raw
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n));
    },
    set generations(value: number[]) {
      const normalised = [...new Set(value)].sort((a, b) => a - b);
      patch({ gen: normalised.length ? normalised.join(',') : null });
    },

    get onlyWithCards() {
      return param('mit') === '1';
    },
    set onlyWithCards(value: boolean) {
      patch({ mit: value ? '1' : null });
    },

    get isActive() {
      return this.query !== '' || this.generations.length > 0 || this.onlyWithCards;
    },

    toggleGeneration(generation: number) {
      const current = this.generations;
      this.generations = current.includes(generation)
        ? current.filter((g) => g !== generation)
        : [...current, generation];
    },

    reset() {
      patch({ q: null, gen: null });
    }
  };
}

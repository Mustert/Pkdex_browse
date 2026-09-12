import { goto } from '$app/navigation';
import { page } from '$app/state';

/** Filter-Zustand der Kartenübersicht – gehalten in der URL (?q=…&ed=SVI,PAL). */
export interface CardFilter {
  query: string;
  editionen: string[];
  readonly isActive: boolean;
  toggleEdition(kuerzel: string): void;
  reset(): void;
}

export function createCardFilter(): CardFilter {
  function param(key: string): string | null {
    return page.url.searchParams.get(key);
  }

  function list(key: string): string[] {
    const raw = param(key);
    return raw ? raw.split(',') : [];
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

    get editionen() {
      return list('ed');
    },
    set editionen(value: string[]) {
      const normalised = [...new Set(value)];
      patch({ ed: normalised.length ? normalised.join(',') : null });
    },

    get isActive() {
      return this.query !== '' || this.editionen.length > 0;
    },

    toggleEdition(kuerzel: string) {
      const current = this.editionen;
      this.editionen = current.includes(kuerzel)
        ? current.filter((k) => k !== kuerzel)
        : [...current, kuerzel];
    },

    reset() {
      patch({ q: null, ed: null });
    }
  };
}

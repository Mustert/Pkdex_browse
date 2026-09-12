import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Reine SPA ohne SSR: adapter-static erzeugt einen index.html-Fallback,
 * das Client-Routing uebernimmt den Rest.
 *
 * BASE_PATH setzen, wenn die App nicht unter der Domain-Wurzel laeuft
 * (z. B. BASE_PATH=/pkdex-tcg-browse fuer GitHub Project Pages).
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    paths: {
      base: process.env.BASE_PATH ?? ''
    }
  }
};

export default config;

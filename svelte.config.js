import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'fallback.html', // Serve 200.html for all non-prerendered routes
    }),
    prerender: {
      entries: ['*'], // Prerender all static pages
    }
  },
  preprocess: vitePreprocess(), // Enable Vite preprocessing
};


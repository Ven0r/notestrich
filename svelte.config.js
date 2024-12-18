import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
    }),
    prerender: {
      entries: ['*'], // Prerender all static pages
    }
  },
  preprocess: vitePreprocess(), // Enable Vite preprocessing
};


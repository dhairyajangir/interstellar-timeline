// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical URLs, social previews and the sitemap use the production domain.
export default defineConfig({
  site: 'https://interstellar-timeline.vercel.app',
  integrations: [sitemap()],
  prefetch: false,
  build: { inlineStylesheets: 'always' },
});

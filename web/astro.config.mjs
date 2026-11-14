// @ts-check
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL || 'https://flowizehub.com';

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});

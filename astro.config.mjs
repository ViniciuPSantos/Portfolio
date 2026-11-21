// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://viniciusps.tech',
  output: 'static',
  adapter: vercel(),
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: { defaultLocale: 'pt', locales: { pt: 'pt-BR', en: 'en' } },
    }),
  ],
});

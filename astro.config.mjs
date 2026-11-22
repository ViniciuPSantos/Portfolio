// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://viniciusps.tech',
  output: 'static',
  // Segredos lidos em runtime pelos endpoints (nunca embutidos no build nem expostos ao cliente).
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
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
      // Os cases têm caminhos traduzidos (/projetos/x/ ↔ /en/projects/x/), que o
      // i18n do plugin não pareia sozinho: adiciona os alternates aqui.
      serialize(item) {
        const m = item.url.match(/\/(?:projetos|en\/projects)\/([a-z0-9-]+)\/$/);
        if (m) {
          const base = 'https://viniciusps.tech';
          item.links = [
            { lang: 'pt-BR', url: `${base}/projetos/${m[1]}/` },
            { lang: 'en', url: `${base}/en/projects/${m[1]}/` },
          ];
        }
        return item;
      },
    }),
  ],
});

import { pt, type Dict } from './pt';
import { en } from './en';

export const langs = ['pt', 'en'] as const;
export type Lang = (typeof langs)[number];

const dicts: Record<Lang, Dict> = { pt, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'pt' ? 'en' : 'pt';
}

export function isLang(value: unknown): value is Lang {
  return value === 'pt' || value === 'en';
}

/** Substitui {chave} na string. */
export function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/**
 * Rotas equivalentes nos dois idiomas. O toggle PT/EN usa estas funções
 * para levar à mesma página no outro idioma.
 */
export const routes = {
  home: (lang: Lang) => (lang === 'pt' ? '/' : '/en/'),
  project: (lang: Lang, slug: string) => (lang === 'pt' ? `/projetos/${slug}/` : `/en/projects/${slug}/`),
  section: (lang: Lang, key: keyof Dict['ids']) => `${routes.home(lang)}#${t(lang).ids[key]}`,
  cv: (lang: Lang) => `/cv/vinicius-santos-${lang}.pdf`,
  contactApi: '/api/contact',
  githubApi: '/api/github',
};

export type PageRef = { kind: 'home' } | { kind: 'project'; slug: string } | { kind: 'notFound' };

export function pathFor(lang: Lang, page: PageRef): string {
  switch (page.kind) {
    case 'home':
    case 'notFound':
      return routes.home(lang);
    case 'project':
      return routes.project(lang, page.slug);
  }
}

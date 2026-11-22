/**
 * Dados pessoais e links. Extraídos do portfólio antigo (CRA) antes da remoção:
 * - GitHub e LinkedIn: portfolio/src/components/NavBar.jsx
 * - Repositórios: portfolio/src/sections/Portfolio.jsx + API pública do GitHub
 */
import type { Lang } from '../i18n/utils';

export const site: {
  name: string;
  url: string;
  domain: string;
  /** E-mail público. Enquanto for null, a linha de e-mail não aparece no site nem no terminal. */
  email: string | null;
  github: { user: string; url: string };
  linkedin: { label: string; url: string };
  /** PDFs do CV em public/cv/. null = ainda não existe; o idioma some das opções de download. */
  cv: Record<Lang, string | null>;
} = {
  name: 'Vinicius Santos',
  url: 'https://viniciusps.tech',
  domain: 'viniciusps.tech',
  email: null,
  github: {
    user: 'ViniciuPSantos',
    url: 'https://github.com/ViniciuPSantos',
  },
  linkedin: {
    label: 'vinicius-de-paula-santos-dev',
    url: 'https://www.linkedin.com/in/vinicius-de-paula-santos-dev',
  },
  cv: {
    pt: null, // quando existir: '/cv/vinicius-santos-pt.pdf'
    en: '/cv/vinicius-santos-en.pdf',
  },
};

export type CvFile = { lang: Lang; url: string };

/** CVs que existem, na ordem pt, en. */
export function availableCvs(): CvFile[] {
  return (Object.entries(site.cv) as [Lang, string | null][])
    .filter((e): e is [Lang, string] => e[1] !== null)
    .map(([lang, url]) => ({ lang, url }));
}

/** CV do idioma pedido; se não existir, o primeiro disponível. */
export function cvFor(lang: Lang): CvFile | undefined {
  const all = availableCvs();
  return all.find((c) => c.lang === lang) ?? all[0];
}

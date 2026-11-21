/**
 * Dados pessoais e links. Extraídos do portfólio antigo (CRA) antes da remoção:
 * - GitHub e LinkedIn: portfolio/src/components/NavBar.jsx
 * - Repositórios: portfolio/src/sections/Portfolio.jsx + API pública do GitHub
 * O e-mail não existia no código antigo (o formulário usava EmailJS).
 */
export const site = {
  name: 'Vinicius Santos',
  url: 'https://viniciusps.tech',
  domain: 'viniciusps.tech',
  email: '[SEU EMAIL]',
  github: {
    user: 'ViniciuPSantos',
    url: 'https://github.com/ViniciuPSantos',
  },
  linkedin: {
    label: 'vinicius-de-paula-santos-dev',
    url: 'https://www.linkedin.com/in/vinicius-de-paula-santos-dev',
  },
  cv: {
    pt: '/cv/vinicius-santos-pt.pdf',
    en: '/cv/vinicius-santos-en.pdf',
  },
} as const;

export const isPlaceholder = (value: string) => /^\[.*\]$/.test(value);

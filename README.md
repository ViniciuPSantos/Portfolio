# viniciusps.tech

Portfólio de Vinicius Santos, desenvolvedor backend. Site one-page com case studies, terminal interativo (Ctrl/Cmd+K), atividade ao vivo do GitHub e formulário de contato, em português e inglês.

## Stack

- **Astro 7** + TypeScript strict, sem framework de UI (interatividade em `<script>` vanilla).
- **CSS puro** com custom properties e estilos com escopo por componente.
- **MDX** para os case studies (content collection validada com zod).
- **Vercel** via `@astrojs/vercel`: páginas pré-renderizadas; só `src/pages/api/*` roda sob demanda.
- **Resend** para o formulário e **GitHub GraphQL API** para a seção de atividade.
- Fontes self-hosted: Inter e JetBrains Mono (fontsource).

## Rodar localmente

```sh
npm install
cp .env.example .env   # opcional: sem as chaves, o GitHub cai no fallback e o formulário responde erro
npm run dev            # http://localhost:4321
npm run build          # astro check + astro build
npm run og             # regenera public/og/og-{pt,en}.png
```

Requer Node ≥ 22.23.

## Estrutura

```
src/
  components/        Header, Footer, Hero, ProjectCard/List, Experience, Stack,
                     GitHubActivity, ContactForm, Terminal, LangToggle, Prompt
  components/case/   Componentes usados no MDX dos cases (Section, Flow, Cards…)
  content/projects/  {pt,en}/<slug>.md(x) — um arquivo por projeto por idioma
  i18n/              pt.ts, en.ts (todos os textos) e utils.ts (rotas equivalentes)
  lib/               projects.ts, contact.ts (validação/rate limit), github.ts (agregação)
  pages/             /, /en/, /projetos/[slug], /en/projects/[slug], 404, api/*
  views/             HomePage e CasePage (compartilhadas entre idiomas)
public/              cv/, og/, favicon.svg, robots.txt
docs/                DEPLOY.md e a spec/mockups do redesign
```

## Conteúdo

- **Novo projeto:** crie `src/content/projects/pt/<slug>.mdx` e `src/content/projects/en/<slug>.mdx` com o mesmo `slug` (o build falha se os idiomas divergirem). Com `hasCase: true`, o projeto ganha página de case e precisa de `meta`.
- **Prints:** coloque a imagem em `src/assets/` e use `cover` + `coverAlt` no frontmatter. No corpo do case, troque `<Shot label="..." />` por `<Shot src={img} alt="..." />`, importando a imagem no topo do MDX.
- **Textos da home, terminal e formulário:** `src/i18n/pt.ts` e `src/i18n/en.ts`.
- **E-mail, GitHub, LinkedIn:** `src/data/site.ts`.

## Variáveis de ambiente

Veja `.env.example`. Todas são lidas só no servidor (`astro:env`). Deploy e DNS: [`docs/DEPLOY.md`](docs/DEPLOY.md).

# Redesign do portfólio — viniciusps.tech

Spec para implementar o novo portfólio. Substitui o app create-react-app atual (deploy em vinicius-santos-portfolio.vercel.app) e passa a responder em **viniciusps.tech**.

## Referência visual

`docs/redesign/design/` tem os mockups aprovados, exportados de um editor de design:

- `Main.dc.html`: home (one-page)
- `Case-Fluxen.dc.html`: página de case study (modelo para todos os projetos)
- `Terminal.dc.html`: terminal interativo (abre com Ctrl/Cmd+K)

São a fonte da verdade para layout, espaçamentos, tipografia, cópia e hierarquia. **Não** reutilize o runtime deles: ignore `support.js`, `<x-dc>`, `<helmet>`, `<sc-for>`, `<sc-if>`, os blocos `data-dc-script` e a sintaxe `{{...}}`. Onde aparece `{{accent}}`, use os tokens de destaque (ver abaixo). Converta os estilos inline em CSS com escopo por componente.

## Stack e decisões

- **Astro** (última estável) + TypeScript strict. Sem framework de UI: interatividade em `<script>` vanilla do Astro.
- **CSS puro** com custom properties + estilos com escopo do Astro. Sem Tailwind.
- **Adapter `@astrojs/vercel`**: páginas pré-renderizadas; somente `src/pages/api/*` on-demand (`export const prerender = false`).
- **Fontes self-hosted** via `@fontsource-variable/inter` e `@fontsource-variable/jetbrains-mono` (nada de Google Fonts CDN).
- Trabalhar na branch **`redesign-astro`**. O CRA atual sai inteiro, mas **antes de apagar**, extraia do código antigo tudo que for útil: e-mail, LinkedIn, textos, imagens/prints, links de repositórios. Use isso para preencher os placeholders.

## Design tokens

```css
:root {
  --bg: #0A0A0A;
  --surface: #111111;
  --surface-2: #161616;
  --chip: #1A1A1A;
  --border-soft: #1F1F1F;
  --border: #262626;
  --border-strong: #333333;
  --text: #EDEDED;
  --text-muted: #A1A1A1;
  --text-dim: #8A8A8A;   /* menor cinza permitido para texto (5.7:1) */
  --accent: #8804E5;      /* preenchimentos: botões, dots, bordas, cursor */
  --accent-text: #B07CFF; /* texto/links/prompt "$" sobre fundo escuro */
  --on-accent: #FFFFFF;   /* texto sobre --accent */
  --danger-text: #FCA5A5;
  --radius-sm: 6px;
  --radius-md: 10px;
  --container: 1120px;
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}
```

**Importante (acessibilidade):** `#8804E5` sobre `#0A0A0A` tem contraste ~3:1, abaixo do WCAG AA para texto. Nos mockups o destaque aparece como texto em vários lugares (prompt `$`, "ler case study →", labels, `[hash]`). Na implementação, **todo texto em destaque usa `--accent-text`**, e `--accent` fica só para preenchimentos e elementos não textuais. Os botões primários são `--accent` com texto `--on-accent` (branco, ~6.6:1), não preto como no mockup.

## Estrutura

```
src/
  layouts/Base.astro          # head, SEO, OG, hreflang, canonical, JSON-LD Person
  components/
    Header.astro  Footer.astro  Prompt.astro ($ comando)
    Hero.astro  ProjectCard.astro  ProjectList.astro
    Experience.astro  Stack.astro  GitHubActivity.astro
    ContactForm.astro  Terminal.astro  LangToggle.astro
  i18n/  pt.ts  en.ts  utils.ts
  content/projects/{pt,en}/   # content collection, 1 .md por projeto por idioma
  pages/
    index.astro  en/index.astro
    projetos/[slug].astro  en/projects/[slug].astro
    404.astro
    api/contact.ts  api/github.ts
public/
  cv/vinicius-santos-pt.pdf  cv/vinicius-santos-en.pdf   # eu forneço
  og/og-pt.png  og/og-en.png
```

## i18n

- Roteamento nativo do Astro: `defaultLocale: 'pt'`, `locales: ['pt', 'en']`, `prefixDefaultLocale: false` → `/` e `/en/`.
- O toggle PT/EN leva à **mesma página** no outro idioma (inclusive nos case studies).
- Sem redirecionamento automático por idioma do navegador.
- Escreva a versão em inglês de todos os textos: tradução natural, tom técnico e direto, não literal.

## Conteúdo

### Home (`Main.dc.html`)
Seções nesta ordem: header sticky, hero (com a janela de terminal decorativa), projetos em destaque, outros projetos (lista estilo `ls -l`), experiência, stack, atividade no GitHub, contato, footer.

### Projetos (content collection)
Frontmatter sugerido (valide com zod): `title`, `slug`, `order`, `featured` (bool), `status` (ex.: `producao` | `pessoal` | `academico`), `summary`, `stack[]`, `cover` (opcional), `links` (`site`, `repo`), `hasCase` (bool).

- **Destaque:** `fluxen`, `ritmo`, `telegram-bot`.
- **Outros:** `scenestack`, `ecobazar`. Linkam direto para o repositório (descubra a URL pelo código antigo ou pela API do GitHub; se não achar, placeholder).
- **Fluxen:** case completo, escrito a partir de `Case-Fluxen.dc.html`.
- **telegram-bot:** o case completo está em `docs/redesign/content/telegram-bot.md`. Use o mesmo template do Fluxen. O card da home usa `cardSummary`. O repositório é público (https://github.com/ViniciuPSantos/TelegramBot) e serve para conferir os detalhes.
- **Ritmo:** crie o `.md` com `hasCase: false` e placeholders. O link "ler case study" só aparece quando `hasCase: true`.
- **Prints do Ritmo:** devem mostrar dados de exemplo, nunca dados reais. Até eu fornecer, use um placeholder.

### Case study (`Case-Fluxen.dc.html`)
Um template genérico alimentado pela collection: breadcrumb `~/viniciusps/projetos/<slug>`, título, resumo, grade de metadados (papel, período, status, stack), imagem principal e corpo em markdown com seções numeradas (01, 02…). No rodapé, navegação para todos os projetos e para o próximo projeto, seguindo `order`. O diagrama de arquitetura do Fluxen pode ser um componente `.astro` usado via MDX, ou HTML no markdown. Escolha o mais simples.

## Funcionalidades

### Terminal (`Terminal.dc.html`)
- `<dialog>` nativo. Abre com **Ctrl+K / Cmd+K** e pelo botão "terminal" do header. **Esc** fecha e devolve o foco a quem abriu.
- Não captura o atalho quando o foco está em input/textarea do formulário.
- Foco no input ao abrir, histórico com ↑/↓, **Tab** autocompleta, `aria-live="polite"` na saída e scroll automático para o fim.
- Comandos: `help`, `whoami`, `ls projetos`, `cat stack`, `contato`, `cv [pt|en]` (dispara o download), `open <projeto>` (navega para o case), `lang pt|en`, `clear`, e o easter egg `sudo`. Saídas traduzidas via i18n; comando desconhecido mostra o erro do mockup.
- Botões de atalho clicáveis abaixo do prompt, para quem não quer digitar.
- Respeita `prefers-reduced-motion`.

### Atividade no GitHub (`api/github.ts`)
- Usuário: **ViniciuPSantos**.
- Endpoint on-demand com `GITHUB_TOKEN` (env; token fine-grained só leitura, acesso público). **Nunca** expor o token no cliente.
- Dados:
  - total de repositórios públicos;
  - contribuições no último ano (GraphQL `contributionsCollection.contributionCalendar.totalContributions`);
  - linguagens agregadas por bytes nos repositórios públicos que não são fork (top 3–5, com %);
  - últimos 3 commits públicos (repo, mensagem, hash curto, data relativa).
- Resposta com `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- No cliente: um script busca o endpoint e preenche a seção, com skeleton enquanto carrega. Se falhar, mostre só o link para o perfil, sem erro visível. A barra de linguagens usa tons de cinza + `--accent`, com rótulos em texto (não depender só de cor).

### Formulário de contato (`api/contact.ts`)
- `POST` JSON. Validação com zod: `nome` 2–100, `email` válido, `assunto` ∈ `vaga | freela | outro`, `mensagem` 10–5000.
- Campo honeypot escondido e rate limit simples por IP (ex.: 5/h; in-memory serve, mas comente que não é distribuído em serverless).
- Envio via **Resend** (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` no domínio viniciusps.tech), com `reply_to` = e-mail do visitante. Escape todo conteúdo do usuário no HTML do e-mail.
- No front: `<form>` real (funciona sem JS e com fetch quando há JS), seletor de assunto como radio estilizado (não botões soltos), estados enviando/sucesso/erro anunciados com `aria-live`, botão desabilitado durante o envio.
- Nunca vazar stack trace nem detalhes internos na resposta.

### CV
"Baixar CV" baixa o PDF do idioma atual e oferece o outro como link secundário. Arquivos em `public/cv/`.

## Qualidade

- **Acessibilidade:** WCAG 2.1 AA, skip link, foco visível (outline com `--accent-text`), alvos de toque ≥44px, a semântica dos mockups (headings, `<nav>`, `<label>`, `aria-label` em botões só com ícone), `lang` correto por página.
- **Responsivo:** mobile-first, testado em 360px. Os mockups já usam flex-wrap: preserve esse comportamento.
- **SEO:** title/description por página e idioma, canonical, `hreflang` pt-BR/en + x-default, `@astrojs/sitemap`, `robots.txt`, OG images 1200×630 no visual terminal (estáticas, uma por idioma), JSON-LD `Person`.
- **Performance:** JS só no terminal, no formulário, no GitHub e no toggle de idioma (se precisar). Imagens via `astro:assets`. Alvo Lighthouse ≥95 nas quatro categorias.
- **Código:** `astro check` e `astro build` sem erros nem warnings. Nada de segredo commitado; crie um `.env.example`.

## Deploy e domínio (só instruções; eu executo)

Ao final, me entregue o passo a passo para:

1. No projeto existente da Vercel: trocar o framework preset para Astro, configurar as envs (`GITHUB_TOKEN`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) e fazer o merge da branch.
2. Adicionar `viniciusps.tech` e `www.viniciusps.tech` na Vercel, com `www` redirecionando para o apex.
3. Configurar o DNS na **Hostinger** com os registros que a Vercel mostrar (normalmente A `@` → `76.76.21.21` e CNAME `www` → `cname.vercel-dns.com`), removendo registros padrão da Hostinger que conflitem.
4. Verificar `viniciusps.tech` no Resend (registros DKIM/SPF/MX na Hostinger).
5. Redirecionar `vinicius-santos-portfolio.vercel.app` para o domínio novo.

## Fora de escopo

Blog, CMS, analytics e tema claro.

## Forma de trabalho

1. Leia o repositório atual e este documento. Me mostre um plano curto antes de codar.
2. Siga esta ordem, com commits pequenos por etapa:
   1. setup + tokens + layout + header/footer + i18n;
   2. home completa em PT e EN;
   3. collection + case Fluxen;
   4. terminal;
   5. formulário + endpoint;
   6. GitHub;
   7. SEO/OG/sitemap + revisão de a11y + Lighthouse;
   8. instruções de deploy.
3. Pergunte só o indispensável. O que faltar vira placeholder `[ASSIM]`. No final, liste todos os placeholders restantes e o que eu preciso fornecer (CVs, prints, e-mail etc.).

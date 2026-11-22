# Deploy: viniciusps.tech na Vercel

Passo a passo para colocar a branch `redesign-astro` no ar e mover o site para **viniciusps.tech**. Tudo aqui é executado por você, no painel da Vercel, da Hostinger e do Resend.

> Ordem recomendada: 1 → 4 (Resend pode levar horas para validar o DNS) → 2 → 3 → 5. O site funciona sem o Resend: o formulário só responde "não foi possível enviar" até as variáveis estarem configuradas.

---

## 1. Projeto existente na Vercel

O app antigo (CRA) ficava na subpasta `portfolio/`. O Astro agora fica na **raiz** do repositório, então a mudança mais importante é o Root Directory.

1. **Settings → Build and Deployment**
   - **Framework Preset:** `Astro`.
   - **Root Directory:** apague `portfolio` e deixe vazio (raiz do repo).
   - **Build Command:** deixe o padrão ou use `npm run build` (roda `astro check` antes do `astro build`).
   - **Output Directory:** deixe o padrão. O adapter `@astrojs/vercel` gera `.vercel/output`, que a Vercel detecta sozinha.
   - **Install Command:** padrão (`npm install`).
   - **Node.js Version:** `24.x`. O `engines` do `package.json` fixa `24.x` e tem prioridade sobre essa configuração; com um intervalo aberto (`>=`), a Vercel buildava com a versão mais nova (26), que as funções não suportam.
2. **Settings → Environment Variables** (marque *Production* e *Preview*):

   | Variável | Valor |
   |---|---|
   | `GITHUB_TOKEN` | Token *fine-grained* criado em GitHub → Settings → Developer settings → Fine-grained tokens. **Repository access: Public repositories (read-only)**, sem nenhuma permissão extra. Defina uma data de expiração e anote para renovar. |
   | `RESEND_API_KEY` | Chave criada no Resend (passo 4), com permissão *Sending access* restrita ao domínio `viniciusps.tech`. |
   | `CONTACT_TO_EMAIL` | O e-mail onde você quer receber as mensagens. |
   | `CONTACT_FROM_EMAIL` | Remetente no domínio verificado, ex.: `Portfólio <contato@viniciusps.tech>`. |

   Marque `GITHUB_TOKEN` e `RESEND_API_KEY` como **Sensitive**. Os segredos são lidos só em runtime pelos endpoints (`astro:env`), nunca entram no bundle do cliente.
3. **Teste num preview antes do merge:** faça push da branch `redesign-astro`. A Vercel cria um deploy de preview. Confira:
   - `/` e `/en/`, os três cases, o toggle PT/EN, o terminal (Ctrl/Cmd+K);
   - `https://<preview>/api/github` deve responder JSON com `repos`, `contributions`, `languages` e `commits`;
   - envie uma mensagem de teste pelo formulário (depois do passo 4).
4. **Merge:** abra o PR `redesign-astro → main` e faça o merge. O deploy de produção sai automaticamente.

## 2. Domínio na Vercel

1. **Settings → Domains → Add:** `viniciusps.tech`.
2. Adicione também `www.viniciusps.tech` e, na edição dele, escolha **Redirect to `viniciusps.tech`** com **308 (Permanent)**.
3. A Vercel mostra os registros DNS esperados. Anote os valores **exatos** que ela exibir (os do passo 3 são os usuais, mas vale o que o painel mostrar).

## 3. DNS na Hostinger

Em **hPanel → Domínios → viniciusps.tech → DNS / Nameservers → Gerenciar registros DNS**:

1. **Remova os registros padrão que conflitam:**
   - qualquer registro `A` com nome `@` que aponte para IPs da Hostinger (parking/hospedagem);
   - qualquer `AAAA` em `@` (a Vercel não usa IPv6 no apex; um AAAA velho faz parte dos acessos cair no parking);
   - `CNAME` de `www` apontando para outro lugar (ex.: `viniciusps.tech` ou parking).
   - **Não** apague registros `MX`, `TXT` (SPF/DKIM) ou `CAA` que você usa para e-mail.
2. **Crie:**

   | Tipo | Nome | Valor | TTL |
   |---|---|---|---|
   | A | `@` | `76.76.21.21` (ou o IP que a Vercel mostrar) | 3600 |
   | CNAME | `www` | `cname.vercel-dns.com` (ou o valor que a Vercel mostrar) | 3600 |

3. Se existir um registro `CAA` em `@`, ele precisa permitir a Let's Encrypt: `0 issue "letsencrypt.org"`. Sem CAA, não precisa fazer nada.
4. Volte em **Vercel → Domains** e espere os dois domínios ficarem *Valid Configuration* (de minutos a algumas horas). O certificado HTTPS é emitido automaticamente.

## 4. Resend: verificar viniciusps.tech

1. **Resend → Domains → Add Domain:** `viniciusps.tech`. Região: a mais próxima (ex.: `sa-east-1`, se disponível).
2. O Resend mostra os registros. Normalmente são:
   - `TXT` em `resend._domainkey` com a chave **DKIM**;
   - `MX` em `send` apontando para `feedback-smtp.<região>.amazonses.com` (prioridade 10);
   - `TXT` em `send` com o **SPF** `v=spf1 include:amazonses.com ~all`.
3. Crie exatamente esses registros na Hostinger (mesmo painel do passo 3). Eles ficam no subdomínio `send`, então **não** conflitam com o MX do seu e-mail principal, se houver.
4. Opcional, recomendado: um `TXT` em `_dmarc` com `v=DMARC1; p=none; rua=mailto:<seu e-mail>` para começar a monitorar.
5. Clique em **Verify** no Resend. Quando ficar *Verified*, crie a API key (passo 1.2) e faça um **Redeploy** na Vercel para a função pegar as variáveis.
6. Teste o formulário em produção. A resposta deve chegar em `CONTACT_TO_EMAIL`, e "Responder" deve ir para o e-mail do visitante (`reply_to`).

## 5. Redirecionar vinicius-santos-portfolio.vercel.app

Já está resolvido no repositório: o `vercel.json` da raiz tem um redirect permanente (308) condicionado ao host, que manda qualquer caminho de `vinicius-santos-portfolio.vercel.app` para o mesmo caminho em `https://viniciusps.tech`. Ele vale a partir do primeiro deploy de produção depois do merge.

1. Confira: `curl -sI https://vinicius-santos-portfolio.vercel.app/en/` deve responder `308` com `location: https://viniciusps.tech/en/`.
2. Os deploys de preview (`*-git-*.vercel.app`) não são afetados, porque o redirect só casa com esse host exato.
3. Atualize os links antigos que você controla: LinkedIn, README do perfil do GitHub, currículo.

---

## Checklist pós-deploy

- [ ] `https://viniciusps.tech` e `https://www.viniciusps.tech` (este redireciona para o apex) com HTTPS válido.
- [ ] `https://vinicius-santos-portfolio.vercel.app` redireciona.
- [ ] `/en/` e os cases em PT e EN abrem; o toggle leva à mesma página no outro idioma.
- [ ] `/api/github` responde com `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- [ ] Formulário: mensagem chega; o honeypot e o rate limit não bloqueiam uso normal.
- [ ] `/cv/vinicius-santos-en.pdf` baixa (e o PT, quando for adicionado em `site.cv`).
- [ ] `/sitemap-index.xml` e `/robots.txt` acessíveis; envie o sitemap no Google Search Console.
- [ ] Prévia de link (OG) no LinkedIn: use o [Post Inspector](https://www.linkedin.com/post-inspector/) com a URL nova.
- [ ] Lighthouse (DevTools → Lighthouse, modo mobile) ≥ 95 nas quatro categorias em `/`, `/en/` e num case.

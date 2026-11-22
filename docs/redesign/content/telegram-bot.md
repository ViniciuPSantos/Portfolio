---
title: Telegram Assistant
slug: telegram-bot
order: 3
featured: true
status: producao
hasCase: true
summary: Assistente pessoal no Telegram, construído como um hub de módulos plugáveis. Hoje tem lembretes e monitor de preços e roda em produção na minha VPS.
cardSummary: Assistente pessoal no Telegram com módulos plugáveis (lembretes e monitor de preços), testes, CI e deploy automático.
stack: [Python 3.12, python-telegram-bot, APScheduler, SQLAlchemy 2.0 async, Alembic, httpx, pytest, Docker, Coolify]
links:
  repo: https://github.com/ViniciuPSantos/TelegramBot
meta:
  papel: Projeto pessoal, desenvolvimento solo
  periodo: "[PERÍODO]"
  status: Em produção (VPS com Coolify)
  stack: Python · SQLAlchemy async · APScheduler · Docker
cover: "[print: /lembrete sendo criado e o aviso chegando com os botões Feito / Adiar 1h]"
---

<!--
Conteúdo do case study do bot (PT). Use como base para
src/content/projects/pt/telegram-bot.md e escreva a versão EN.
Fonte: README e código de https://github.com/ViniciuPSantos/TelegramBot (público).
Antes de publicar, reconte os testes no repositório (havia 101 funções de teste
em 16/11/2026) e confira se algo mudou.
-->

## 01 · O problema

[Em 2–3 frases, com suas palavras. Sugestão: eu queria um lugar só para as automações do dia a dia, como lembrar de contas e acompanhar o preço de produtos, sem instalar mais um app. O Telegram já está no meu celular, então o bot virou a interface.]

## 02 · Arquitetura

Cada funcionalidade é um módulo independente que expõe `register(app, ctx)` e recebe um `AppContext` com as dependências compartilhadas (configurações, banco, scheduler). Adicionar um módulo novo é adicionar uma linha na lista de módulos.

Diagrama (mesmo estilo de caixas do case do Fluxen):

Telegram ⇄ python-telegram-bot (long polling) → autenticação por chat_id → handlers → service → repository → SQLite / Postgres

APScheduler (a cada 30s) → service → Notifier → Telegram

Tags abaixo do diagrama: `Docker` · `Coolify` · `GitHub Actions` · `Alembic`

## 03 · Decisões técnicas

Cards (mesmo layout do Fluxen):

- **O banco é a fonte de verdade.** Em vez de agendar um job por lembrete, um único job consulta o banco a cada 30s. Nada se perde se o bot reiniciar, e lembretes vencidos com o bot fora do ar são entregues na subida, marcados como atrasados.
- **Regras de negócio sem Telegram.** O service recebe um `Notifier` (um `Protocol`) e trabalha só em UTC. Handlers apenas traduzem entrada e saída, e as views são funções puras.
- **UTC no banco, fuso só na borda.** Um `TypeDecorator` garante UTC até no SQLite. A conversão para `America/Sao_Paulo` acontece apenas na exibição.
- **Entrega "pelo menos uma vez".** O aviso só é marcado como enviado depois que o Telegram confirma o envio.
- **Dinheiro em centavos.** Preços são `int` em centavos no banco e nas regras. `Decimal` aparece só na leitura do texto digitado. Nunca `float`.

## 04 · Monitor de preços: scraping responsável e seguro

O monitor lê os preços pelo JSON-LD das páginas das lojas e avisa quando o preço chega no alvo, cai 1% ou mais, ou quando o produto volta ao estoque.

- **Consultas educadas:** cada produto é verificado a cada 8h (±30 min), em lotes de 10 e com pausas de 3 a 8s entre requisições. Se a loja responder 403, 429 ou 503, ela fica pausada por 6h. Nada de proxies nem de burlar captcha.
- **Proteção contra SSRF:** o bot só busca links de domínios permitidos e confere o domínio de novo depois dos redirecionamentos, porque o container divide a rede com outros serviços.
- **Bot privado:** só responde ao `chat_id` configurado. Qualquer outro usuário é ignorado, e a tentativa fica registrada no log.

## 05 · Qualidade e deploy

- **101 testes** com pytest, sem nenhum acesso à rede: relógio, loja e notifier falsos sobre um SQLite em memória.
- **CI no GitHub Actions:** lint e formatação (ruff), testes, verificação de que as migrations estão em dia com os models e build da imagem Docker.
- A `main` é protegida e só recebe código via PR com os checks verdes. Cada merge dispara deploy automático no Coolify.
- O container não expõe portas (long polling), tem limites de CPU e memória e recebe os segredos só em runtime, nunca no build.

Diagrama do fluxo: PR → CI (lint · testes · migrations · build) → merge na main → webhook → Coolify → container no ar

## 06 · Próximos passos e aprendizados

- Próximos módulos: suporte a Amazon e Mercado Livre no monitor de preços e um resumo diário.
- [2–3 aprendizados com suas palavras.]

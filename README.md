# Central de Produção — Unica Planner

App que sincroniza os pedidos em aberto do Shopify 1x por dia, agrupa por
produto para produção em lote e sinaliza prioridade com base no prazo de
entrega (10–15 dias úteis).

## Stack

- **Next.js** (App Router) na Vercel
- **Postgres** via Prisma (driver adapter `@prisma/adapter-pg`)
- **Vercel Cron** chamando `/api/cron/sync` 1x por dia
- Autenticação simples por senha única (não há múltiplos usuários)

## Como funciona a sincronização

`src/lib/sync.ts` busca todos os pedidos com `status:open` no Shopify
(não arquivados, não cancelados) e faz upsert no banco local:

- Dados do pedido (cliente, data, valores, status) são sempre atualizados
  com o que vem do Shopify.
- `LineItem.statusProducao` e `dataProducao` **nunca** são sobrescritos pelo
  sync — é o único dado que o Shopify não conhece e que precisa sobreviver
  entre sincronizações.
- Pedidos que saem do estado aberto (cumpridos ou cancelados) são marcados
  com `stillOpenInShopify = false` e somem das telas de "pedidos abertos".

Prioridade (`src/lib/priority.ts`) é calculada a partir de
`prazoLimite = data do pedido + 15 dias úteis`, recalculada a cada
carregamento de página (não fica desatualizada entre syncs):

- **Atrasado**: prazo já passou
- **Sai hoje**: hoje é o último dia útil do prazo
- **Sai amanhã**: falta 1 dia útil
- **No prazo**: mais de 1 dia útil de folga

> Limitação atual: dias úteis considera só sábado/domingo, sem calendário de
> feriados nacionais.

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha:
   - `DATABASE_URL`: connection string do Postgres (ver abaixo)
   - `SHOPIFY_STORE_DOMAIN` e `SHOPIFY_ADMIN_ACCESS_TOKEN` (ver abaixo)
   - `APP_PASSWORD`, `APP_SECRET`, `CRON_SECRET`: strings aleatórias suas

2. Instale as dependências e gere o Prisma Client:

   ```bash
   npm install
   npm run db:push
   ```

3. Rode o app:

   ```bash
   npm run dev
   ```

### Criar o banco Postgres (Vercel Postgres / Neon)

No dashboard da Vercel → aba **Storage** → **Create Database** → **Postgres**.
Depois de criado, copie a connection string (prefira a **direta**, sem
`pgbouncer`) e use como `DATABASE_URL` tanto local quanto na Vercel.

### Criar o token do Shopify

No admin do Shopify: **Configurações → Apps e canais de vendas → Desenvolver
apps → Criar um app**. Em "Configuração da API Admin", dê o escopo
`read_orders`. Instale o app e revele o **Admin API access token**
(`shpat_...`).

## Deploy

1. Suba o repositório pro GitHub.
2. Na Vercel, importe o repositório (ou use o MCP `create_git_project`).
3. Configure as variáveis de ambiente do passo acima nas Environment
   Variables do projeto (Production **e** Preview).
4. O `vercel.json` já registra o cron diário em `/api/cron/sync` — a Vercel
   gera o `CRON_SECRET` automaticamente ou usa o que você configurou.
5. Depois do primeiro deploy, rode `npm run db:push` apontando pra
   `DATABASE_URL` de produção (ou clique em "Sincronizar agora" no app,
   que só funciona depois que as tabelas existirem).

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção (roda `prisma generate` antes)
- `npm run db:push` — aplica o schema do Prisma no banco (sem migrations)
- `npm run db:studio` — abre o Prisma Studio pra inspecionar os dados

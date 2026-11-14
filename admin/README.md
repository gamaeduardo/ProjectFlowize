# Flowize — painel admin

SPA em React + Vite para gerenciar clientes e publicar o site. Roda em
`admin.flowizehub.com` e conversa com o Supabase.

## Rodar

```bash
npm ci
cp .env.example .env   # preencha URL e anon key do Supabase
npm run dev
```

Abre em `http://localhost:5174`.

### Modo demonstração

Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o painel abre direto (sem
login) e usa os JSONs de `web/src/data/clientes` com dados no `localStorage`.
Serve para mexer na interface antes de criar o projeto no Supabase. Nada é
publicado nesse modo.

## Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cole e rode `../supabase/migrations/20261114120000_init.sql`.
3. Opcional: rode `../supabase/seed.sql` para carregar os dois clientes de
   demonstração.
4. Em **Authentication → Users**, crie o usuário do painel (e-mail + senha).
5. Em **Authentication → Providers → Email**, desligue **Allow new users to
   sign up**. O painel não tem cadastro.
6. Em **Project Settings → API**, copie a **Project URL** e a **anon public
   key** para o `.env` (e para as variáveis do Netlify).

A migration já cria:

- `clients` com validações de slug, status, pacote e WhatsApp
- `publish_events` com o histórico de publicações
- RLS: só usuário autenticado lê e escreve; o site público não acessa o banco
- bucket `fotos` (público para leitura) para as imagens dos itens

## Publicar o site pelo painel

O botão **Publicar site** chama a Edge Function `publish`, que dispara o build
hook do Netlify. Para configurar:

```bash
# no Netlify: Site configuration → Build & deploy → Build hooks → Add build hook
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy publish
supabase secrets set NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/SEU_HOOK
```

Sem a função, o botão mostra o erro retornado pelo Supabase — o resto do painel
continua funcionando.

## Deploy (Netlify)

O painel é um **segundo site** no Netlify, no mesmo repositório:

1. **Add new site → Import an existing project** e escolha o repositório.
2. Em **Base directory**, coloque `admin` (o Netlify passa a ler
   `admin/netlify.toml`).
3. Confirme build `npm ci` e publish `dist`.
4. Em **Environment variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Em **Domain management**, adicione `admin.flowizehub.com`.

O `admin/netlify.toml` já cuida do redirecionamento da SPA, do `noindex` e dos
headers de segurança.

> A anon key pode ficar no navegador: quem protege os dados é o RLS. A
> `service_role` **nunca** entra aqui — ela só é usada no build do site e na
> Edge Function.

## Build do site com os dados do Supabase

O site (`../web`) continua estático. No build, ele lê a tabela `clients` quando
estas variáveis existem no Netlify:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Sem elas, o build usa os JSONs locais de `web/src/data/clientes` — é o que
acontece hoje no deploy.

## Schema compartilhado

`src/lib/schema.ts` é uma cópia fiel de `web/src/lib/schema.ts`. Depois de mudar
o schema no site:

```bash
cp ../web/src/lib/schema.ts src/lib/schema.ts
npm run checar-schema
```

O script falha se as duas cópias estiverem diferentes.

## Estrutura

```
src/
├─ components/
│  ├─ CardapioEditor.tsx   # categorias, itens, opções, fotos e ilustrações
│  ├─ Layout.tsx
│  └─ SeloStatus.tsx
├─ lib/
│  ├─ db.ts                # CRUD, upload e publicação (Supabase ou demo)
│  ├─ demo.ts              # dados de demonstração no localStorage
│  ├─ format.ts
│  ├─ schema.ts            # cópia do schema do site
│  ├─ supabase.ts
│  └─ types.ts
└─ pages/
   ├─ Clientes.tsx         # lista, busca, filtro e publicar
   ├─ ClienteEditor.tsx    # dados, cardápio e financeiro
   └─ Login.tsx
```

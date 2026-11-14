# Supabase

## Conteúdo

- `migrations/20261114120000_init.sql` — tabelas `clients` e `publish_events`,
  RLS, trigger de `updated_at` e bucket `fotos`.
- `seed.sql` — dois clientes de demonstração (opcional, pode rodar de novo sem
  duplicar).
- `functions/publish/index.ts` — Edge Function que dispara o build hook do
  Netlify depois de validar a sessão.

## Aplicar

Pelo painel do Supabase, no **SQL Editor**, rode primeiro a migration e depois
o seed. Ou, com a CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Função de publicação

```bash
supabase functions deploy publish
supabase secrets set NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/SEU_HOOK
```

A função exige usuário autenticado (JWT do painel) e grava cada tentativa em
`publish_events`.

## Acesso

- `anon` não tem nenhuma policy: o site público **não** consulta o banco.
- `authenticated` lê e escreve em `clients` e lê `publish_events`.
- O build do site usa a `service_role` apenas no servidor do Netlify.

Desligue o cadastro público em **Authentication → Providers → Email**.

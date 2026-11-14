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

Com a CLI (não precisa de Docker nem de `supabase link`, graças ao
`config.toml`):

```bash
npx supabase login

# --use-api empacota no servidor da Supabase (sem Docker)
npx supabase functions deploy publish --use-api --remote=vzjpbadtbjgmwxfphftu

npx supabase secrets set NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/SEU_HOOK \
  --remote=vzjpbadtbjgmwxfphftu
```

A função exige usuário autenticado (JWT do painel) e grava cada tentativa em
`publish_events`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas
pelo Supabase em toda Edge Function — só o build hook precisa ser configurado.

Teste rápido depois do deploy:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://SEU-PROJETO.supabase.co/functions/v1/publish" \
  -H "apikey: SUA_PUBLISHABLE_KEY"
```

`401` é o esperado (sem sessão). Se vier `404`, a função ainda não subiu.

## Acesso

- `anon` não tem nenhuma policy: o site público **não** consulta o banco.
- `authenticated` lê e escreve em `clients` e lê `publish_events`.
- O build do site usa a `service_role` apenas no servidor do Netlify.

Desligue o cadastro público em **Authentication → Providers → Email**.

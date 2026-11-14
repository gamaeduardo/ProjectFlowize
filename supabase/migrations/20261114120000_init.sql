-- Flowize — Fase 2: clientes, cardápio e publicação.
--
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).
-- O painel admin escreve com usuário autenticado; o build do site usa a
-- service role key apenas no servidor do Netlify.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60)
    check (slug not in (
      'admin', 'api', 'preview', 'og', 'qr', 'exemplos', 'sitemap', 'robots',
      'index', '404', 'favicon', '_astro'
    )),
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  slogan text,
  pacote text not null default 'simples' check (pacote in ('simples', 'completo')),
  status text not null default 'teste' check (status in ('teste', 'ativo', 'inativo')),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  instagram text,
  endereco text,
  maps_url text,
  tempo text,
  taxa numeric(10, 2) not null default 0 check (taxa >= 0),
  horario jsonb,
  pagamentos text[] not null default '{}',
  cores jsonb not null default '{}'::jsonb,
  categorias jsonb not null default '[]'::jsonb,
  analytics_website_id text,
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  valor_mensal numeric(10, 2) check (valor_mensal >= 0),
  paid_until date,
  notas text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is
  'Um cliente = um cardápio em flowizehub.com/<slug>. "categorias" é o JSONB validado por Zod no build.';
comment on column public.clients.paid_until is
  'Só sinaliza atraso no painel. Nunca bloqueia o cardápio automaticamente.';

create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_paid_until_idx on public.clients (paid_until);

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_tocar_updated_at on public.clients;
create trigger clients_tocar_updated_at
  before update on public.clients
  for each row execute function public.tocar_updated_at();

-- ---------------------------------------------------------------------------
-- Histórico de publicações (disparadas pela Edge Function "publish")
-- ---------------------------------------------------------------------------
create table if not exists public.publish_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  status text not null check (status in ('disparado', 'falhou')),
  mensagem text
);

create index if not exists publish_events_created_at_idx
  on public.publish_events (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: só usuário autenticado (o admin) acessa. O site público não consulta o
-- banco: ele é gerado no build com a service role.
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.publish_events enable row level security;

drop policy if exists "admin le clientes" on public.clients;
drop policy if exists "admin cria clientes" on public.clients;
drop policy if exists "admin edita clientes" on public.clients;
drop policy if exists "admin remove clientes" on public.clients;

create policy "admin le clientes" on public.clients
  for select to authenticated using (true);
create policy "admin cria clientes" on public.clients
  for insert to authenticated with check (true);
create policy "admin edita clientes" on public.clients
  for update to authenticated using (true) with check (true);
create policy "admin remove clientes" on public.clients
  for delete to authenticated using (true);

drop policy if exists "admin le publicacoes" on public.publish_events;
create policy "admin le publicacoes" on public.publish_events
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage: fotos dos itens do cardápio (bucket público para leitura)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos', 'fotos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "admin envia fotos" on storage.objects;
drop policy if exists "admin atualiza fotos" on storage.objects;
drop policy if exists "admin apaga fotos" on storage.objects;

create policy "admin envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "admin atualiza fotos" on storage.objects
  for update to authenticated using (bucket_id = 'fotos');
create policy "admin apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');

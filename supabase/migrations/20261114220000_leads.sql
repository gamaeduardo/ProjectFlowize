-- Flowize — Fase 5: leads (prospecção).
--
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).
-- O funil é simples: novo → contatado → negociando → cliente | perdido.
-- Ao virar cliente, o lead guarda o vínculo em `client_id`.

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  telefone text check (telefone ~ '^[0-9]{10,15}$'),
  instagram text,
  maps_url text,
  bairro text,
  origem text not null default 'maps'
    check (origem in ('maps', 'instagram', 'indicacao', 'whatsapp', 'outro')),
  etapa text not null default 'novo'
    check (etapa in ('novo', 'contatado', 'negociando', 'cliente', 'perdido')),
  proximo_followup date,
  notas text,
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is
  'Prospecção. "cliente" é o fim do funil; client_id liga ao cardápio criado.';
comment on column public.leads.proximo_followup is
  'Data em que vale a pena chamar de novo. O painel destaca os vencidos.';

create index if not exists leads_etapa_idx on public.leads (etapa);
create index if not exists leads_followup_idx on public.leads (proximo_followup);

drop trigger if exists leads_tocar_updated_at on public.leads;
create trigger leads_tocar_updated_at
  before update on public.leads
  for each row execute function public.tocar_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: só o painel autenticado enxerga. O site público não consulta leads.
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists "admin le leads" on public.leads;
drop policy if exists "admin cria leads" on public.leads;
drop policy if exists "admin edita leads" on public.leads;
drop policy if exists "admin remove leads" on public.leads;

create policy "admin le leads" on public.leads
  for select to authenticated using (true);
create policy "admin cria leads" on public.leads
  for insert to authenticated with check (true);
create policy "admin edita leads" on public.leads
  for update to authenticated using (true) with check (true);
create policy "admin remove leads" on public.leads
  for delete to authenticated using (true);

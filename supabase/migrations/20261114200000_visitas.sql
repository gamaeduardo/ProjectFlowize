-- Flowize — Fase 4: contador próprio de visitas.
--
-- Rode no SQL Editor do Supabase, depois da migration do financeiro.
-- Conta visitas por cardápio, por dia, sem cookie e sem guardar IP.
-- O Umami continua sendo a fonte de detalhe (origem, dispositivo, tempo).

-- ---------------------------------------------------------------------------
-- Visitas agregadas por cliente e por dia
-- ---------------------------------------------------------------------------
create table if not exists public.pageviews (
  client_id uuid not null references public.clients (id) on delete cascade,
  dia date not null,
  visitas integer not null default 0 check (visitas >= 0),
  primary key (client_id, dia)
);

comment on table public.pageviews is
  'Contagem agregada de visitas por cardápio e por dia. Sem dados pessoais.';

create index if not exists pageviews_dia_idx on public.pageviews (dia desc);

alter table public.pageviews enable row level security;

drop policy if exists "admin le visitas" on public.pageviews;
drop policy if exists "admin apaga visitas" on public.pageviews;

create policy "admin le visitas" on public.pageviews
  for select to authenticated using (true);
create policy "admin apaga visitas" on public.pageviews
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Beacon do cardápio: incrementa 1 visita no dia de hoje (fuso de Brasília).
-- Security definer para o anônimo poder gravar sem acesso direto à tabela.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_visita(p_slug text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_id uuid;
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select id into v_client_id
    from public.clients
   where slug = p_slug
     and status <> 'inativo'
   limit 1;

  if v_client_id is null then
    return;
  end if;

  insert into public.pageviews (client_id, dia, visitas)
  values (v_client_id, v_dia, 1)
  on conflict (client_id, dia)
  do update set visitas = public.pageviews.visitas + 1;
end;
$$;

revoke all on function public.registrar_visita(text) from public;
grant execute on function public.registrar_visita(text) to anon, authenticated;

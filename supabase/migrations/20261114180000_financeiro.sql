-- Flowize — Fase 3: financeiro.
--
-- Rode no SQL Editor do Supabase, depois da migration inicial.
-- Nada aqui bloqueia cardápio: `paid_until` é só sinalização no painel.

-- ---------------------------------------------------------------------------
-- Pagamentos recebidos
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  valor numeric(10, 2) not null check (valor >= 0),
  pago_em date not null default current_date,
  referencia text,
  paid_until_anterior date,
  paid_until_novo date,
  created_at timestamptz not null default now()
);

comment on table public.payments is
  'Cada mensalidade recebida. O cardápio nunca é bloqueado por falta de pagamento.';

create index if not exists payments_client_idx
  on public.payments (client_id, pago_em desc);
create index if not exists payments_pago_em_idx
  on public.payments (pago_em desc);

alter table public.payments enable row level security;

drop policy if exists "admin le pagamentos" on public.payments;
drop policy if exists "admin cria pagamentos" on public.payments;
drop policy if exists "admin apaga pagamentos" on public.payments;

create policy "admin le pagamentos" on public.payments
  for select to authenticated using (true);
create policy "admin cria pagamentos" on public.payments
  for insert to authenticated with check (true);
create policy "admin apaga pagamentos" on public.payments
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Registrar pagamento: grava o pagamento e empurra o `paid_until` na mesma
-- transação. O novo vencimento é calculado no painel (fuso e fim de mês) e
-- chega aqui pronto.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_pagamento(
  p_client_id uuid,
  p_valor numeric,
  p_pago_em date,
  p_referencia text,
  p_novo_paid_until date
)
returns public.payments
language plpgsql
as $$
declare
  v_anterior date;
  v_pagamento public.payments;
begin
  select paid_until into v_anterior
    from public.clients
   where id = p_client_id
     for update;

  if not found then
    raise exception 'Cliente não encontrado.';
  end if;

  insert into public.payments (
    client_id, valor, pago_em, referencia, paid_until_anterior, paid_until_novo
  )
  values (
    p_client_id, p_valor, p_pago_em, p_referencia, v_anterior, p_novo_paid_until
  )
  returning * into v_pagamento;

  update public.clients
     set paid_until = p_novo_paid_until
   where id = p_client_id;

  return v_pagamento;
end;
$$;

revoke all on function public.registrar_pagamento(uuid, numeric, date, text, date) from public;
grant execute on function public.registrar_pagamento(uuid, numeric, date, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Estorno: apaga o pagamento e devolve o `paid_until` anterior.
-- Use só no pagamento mais recente do cliente.
-- ---------------------------------------------------------------------------
create or replace function public.estornar_pagamento(p_id uuid)
returns void
language plpgsql
as $$
declare
  v_pagamento public.payments;
begin
  delete from public.payments
   where id = p_id
  returning * into v_pagamento;

  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  update public.clients
     set paid_until = v_pagamento.paid_until_anterior
   where id = v_pagamento.client_id;
end;
$$;

revoke all on function public.estornar_pagamento(uuid) from public;
grant execute on function public.estornar_pagamento(uuid) to authenticated;

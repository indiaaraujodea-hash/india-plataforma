-- Leads da Calculadora da Psicóloga (página pública /calculadora).
-- Cole no Supabase → SQL Editor → New query → Run. Pode rodar mais de uma vez.

create table if not exists public.leads_calculadora (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  criado_em timestamptz not null default now()
);

-- Se a tabela já existia com outra estrutura, garante as colunas esperadas.
alter table public.leads_calculadora
  add column if not exists criado_em timestamptz not null default now();

-- Aproveita a data original, se a tabela antiga usava "created_at".
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'leads_calculadora' and column_name = 'created_at') then
    execute 'update public.leads_calculadora set criado_em = created_at where created_at is not null';
  end if;
end $$;

alter table public.leads_calculadora
  add column if not exists calculadora text not null default 'Quanto vale a minha sessão?';

alter table public.leads_calculadora enable row level security;

-- Visitantes (anon) e usuárias logadas só podem INSERIR, com dados mínimos válidos.
grant insert on public.leads_calculadora to anon, authenticated;

drop policy if exists leads_calculadora_insert_publico on public.leads_calculadora;
create policy leads_calculadora_insert_publico on public.leads_calculadora
  for insert to anon, authenticated
  with check (
    char_length(nome) between 1 and 200
    and char_length(email) between 3 and 320
    and email like '%_@_%'
    and char_length(calculadora) <= 100
  );

-- Leitura só para admin (painel /admin). Não há policy de UPDATE/DELETE.
drop policy if exists leads_calculadora_select_admin on public.leads_calculadora;
create policy leads_calculadora_select_admin on public.leads_calculadora
  for select using (public.is_admin());
